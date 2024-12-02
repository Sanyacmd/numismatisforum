// Хранилище пользователей, тем и забаненных
let users = JSON.parse(localStorage.getItem('users')) || [];
let topics = JSON.parse(localStorage.getItem('topics')) || [];
let bannedUsers = JSON.parse(localStorage.getItem('bannedUsers')) || [];

// Проверка, забанен ли пользователь
function isBanned(email) {
    const banRecord = bannedUsers.find(user => user.email === email);
    if (banRecord) {
        const currentTime = new Date();
        const banEndTime = new Date(banRecord.banEndDate);
        if (currentTime < banEndTime) {
            return true;
        } else {
            // Срок бана истек, удаляем запись о бане
            bannedUsers = bannedUsers.filter(user => user.email !== email);
            localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
            return false;
        }
    }
    return false;
}

// Проверка, является ли пользователь администратором
function isAdmin(email) {
    return email === "alexanbryashkin@gmail.com";
}

// Проверка текущего пользователя и обновление интерфейса
function checkCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        // Скрытие формы регистрации
        document.querySelector('.registration').style.display = 'none';

        // Проверка, забанен ли пользователь
        if (isBanned(currentUser.email)) {
            alert('Вы забанены и не можете выполнять действия на сайте.');
            localStorage.removeItem('currentUser');
            checkCurrentUser();
            return;
        }

        // Отображение консоли администратора для администратора
        if (isAdmin(currentUser.email)) {
            document.querySelector('.admin-console').style.display = 'block';
        } else {
            document.querySelector('.admin-console').style.display = 'none';
        }

        // Отображение формы создания темы
        document.querySelector('.new-topic').style.display = 'block';
    } else {
        document.querySelector('.registration').style.display = 'block';
        document.querySelector('.new-topic').style.display = 'none';
        document.querySelector('.admin-console').style.display = 'none';
    }
}

// Обработка формы создания темы
document.getElementById('new-topic-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Проверка на бан
    if (currentUser && isBanned(currentUser.email)) {
        alert('Вы забанены и не можете создавать темы.');
        return;
    }

    const title = document.getElementById('topic-title').value.trim();
    const content = document.getElementById('topic-content').value.trim();

    // Проверка на пустые значения
    if (!title || !content) {
        alert("Заполните все поля!");
        return;
    }

    // Создание новой темы
    const topic = { title, content };
    topics.push(topic);
    localStorage.setItem('topics', JSON.stringify(topics));

    // Обновление списка тем
    displayTopics();

    // Очистка формы
    document.getElementById('new-topic-form').reset();
});

// Функция для отображения списка тем
function displayTopics() {
    const topicsList = document.getElementById('topics-list');
    topicsList.innerHTML = '';  // Очистка списка перед обновлением

    topics.forEach(topic => {
        const topicDiv = document.createElement('div');
        topicDiv.classList.add('topic');

        const topicTitle = document.createElement('h3');
        topicTitle.textContent = topic.title;

        const topicContent = document.createElement('p');
        topicContent.textContent = topic.content;

        topicDiv.appendChild(topicTitle);
        topicDiv.appendChild(topicContent);
        topicsList.appendChild(topicDiv);
    });
}

// Обработка команды /ban из консоли администратора
document.getElementById('admin-console-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const command = document.getElementById('admin-command').value.trim();
    const outputDiv = document.getElementById('admin-console-output');
    outputDiv.innerHTML = ''; // Очистка вывода

    // Проверка команды
    const banCommandRegex = /^\/ban\s([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s(\d+)\s(.+)$/;
    const match = command.match(banCommandRegex);

    if (match) {
        const [_, email, duration, reason] = match;

        // Проверка, существует ли такой пользователь
        const userToBan = users.find(user => user.email === email);
        if (!userToBan) {
            outputDiv.textContent = 'Пользователь с таким email не найден.';
            return;
        }

        // Добавление в список забаненных
        const banEndDate = new Date();
        banEndDate.setMinutes(banEndDate.getMinutes() + parseInt(duration));

        bannedUsers.push({ email, reason, banEndDate: banEndDate.toISOString() });
        localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));

        outputDiv.textContent = `Пользователь ${email} был забанен на ${duration} минут. Причина: ${reason}`;
    } else {
        outputDiv.textContent = 'Некорректная команда. Используйте формат: /ban [Email] [насколько] [причина]';
    }

    // Очистка команды
    document.getElementById('admin-command').value = '';
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    checkCurrentUser();
    displayTopics();
    checkBans();
});

// Проверка на бан при загрузке
function checkBans() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && isBanned(currentUser.email)) {
        const banInfo = bannedUsers.find(user => user.email === currentUser.email);
        alert(`Вы забанены. Причина: ${banInfo.reason}`);
        localStorage.removeItem('currentUser');
        checkCurrentUser();
    }
}
