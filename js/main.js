const myForm = document.querySelector('.form'), 
      wrapper = document.querySelector('.wrapper'),
      formFields = document.querySelectorAll('.form-field'), 
      inputTask = document.querySelector('#task-text'),
      inputDate = document.querySelector('.form-field--date'),
      inputTime = document.querySelector('.form-field--time'),
      categories = document.querySelectorAll('.categories__group'),
      taskList = document.querySelector('.task-list'),
      notifications = document.querySelector('.notifications'),
      btnAddTask = document.querySelector('.add-task__btn'),
      nowDate = Date.now(),
      allTasks = JSON.parse(localStorage.getItem('allTasks')) || [];

const messages = {
  errorRequired: 'Це поле не може бути порожнім',
  errorText: 'Довжина тексту не може бути більшою за 100 символів і меншою за 3 символи.',
  smallDate: 'Дата має бути хоча б трохи більша за поточну',
  bigDate: 'Не плануй так далеко, не далі року',
  errorTimeIfEmptyData: 'Спочатку правильно заповніть поле з датою',
  errorTime: 'Час має бути хоча б на 30 хв більший за поточний'
};
console.log(allTasks);

const msgType = {
  add: 'add-task',
  remove: 'remove-task',
  done: 'done-task'
};

const msgText = {
  add: 'Додано нове завдання',
  remove: 'Завдання видалено',
  done: 'Завдання виконано'
};
const yearInMs = 365 *24 * 3600 *1000;

addFormValidation(myForm);

addTaskToPage(allTasks);


function addFormValidation(formName) {
  formName.addEventListener('input', formInputHandler);
  formFields.forEach(item => {
    item.addEventListener('focus', () => checkOnFocus(item));
    item.addEventListener('blur', () => checkOnBlur(item));
  });
};

function formInputHandler(e) {
  const target = e.target;
  if(target.tagName === 'TEXTAREA') {
    checkTextLength(target, messages.errorText);
  } else if (target.type === 'date') {
    checkDate(target, messages);
  } else if (target.type === 'time') {
    checkTime(target, messages);
  };
};

function checkTextLength(target, message) {
  if(target.value.length < 3 || target.value.length > 100) {
    addFieldError(target, message);
  } else {
    addFieldSuccess(target);
  };
};

function addFieldError(input, errorMessage) {
  const group = input.closest('.add-task__group');
  group.classList.remove('success');
  group.classList.add('error');
  group.querySelector('.form-error-msg').textContent = errorMessage;
};

function addFieldSuccess(input) {
  const group = input.closest('.add-task__group');
  group.classList.add('success');
  group.classList.remove('error');
  group.querySelector('.form-error-msg').textContent = '';
};

function convertStringTimeToMS(stringTime){
  const timeParts = stringTime.split(':');
  if(timeParts.length > 2) {
    return ((+timeParts[0] * 60) + +timeParts[1]) * 60000 + +timeParts[2] * 1000 + +timeParts[3];
  } else {
    return ((+timeParts[0] * 60) + +timeParts[1]) * 60000;
  }
};

function checkTime(target, message) {
  const inputTime = convertStringTimeToMS(target.value);
  const currentTime = convertStringTimeToMS(`${new Date().getHours()}:${new Date().getMinutes()}`);
  const inputDate = (myForm.taskDate.value.replaceAll('0', '')) || 0;
  const currentDate = (`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`).replaceAll('0', '');
  if (inputDate === currentDate && inputTime < currentTime + 30 * 6000) {
    console.log('alert');
    addFieldError(target, messages.errorTime);
  } else if (!inputDate) {
    addFieldError(target, messages.errorTimeIfEmptyData);
    addFieldError(myForm.taskDate, messages.errorRequired);
  } else {
    addFieldSuccess(target);
  };
};

function checkDate(target, message) {
  const inputDate = Date.parse(target.value) - (3 * 3600 * 1000);
  const currentTime = convertStringTimeToMS(`${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:${new Date().getMilliseconds()}`);
  const currentDate = Date.now() - currentTime;
  const timeDiff = convertStringTimeToMS(myForm.taskTime.value) - currentTime;

  console.log(Date.parse(target.value));
  console.log(currentDate);
  if (inputDate < currentDate) {
    addFieldError(target, message.smallDate);
  } else if (inputDate - currentDate > yearInMs ) {
    addFieldError(target, message.bigDate);
  } else {
    addFieldSuccess(target);
    if (myForm.taskTime.value.length < 1) {
      addFieldError(myForm.taskTime, messages.errorRequired);
    } else if ( inputDate === currentDate &&  timeDiff > 30 * 60000){
      addFieldError(myForm.taskTime, messages.errorTime);
    } else {
      addFieldSuccess(myForm.taskTime);
    }
  };
};


function checkOnFocus(target) {
  if(target.value.length < 1) {
    addFieldError(target, messages.errorRequired);
  };
};

function checkOnBlur(target) {
  if(target.closest('.add-task__group').classList.contains('success')) {
    target.closest('.add-task__group').querySelector('.form-error-msg').textContent = '';
  }
};

function createTask() {
  const taskObj = {
    id: Math.floor(Math.random() * 10000),
    text: myForm.taskText.value,
    dateTime: `${myForm.taskDate.value}T${myForm.taskTime.value}`,
    taskStatus: 'new',
  };

  myForm.taskCategory.forEach(radio => {
    if(radio.checked) {
      taskObj.category = radio.value;
    }
  });
  return taskObj;
};

function getTaskNameCategory(categoryName) {
  const categories = {
    urgent: 'Негайно',
    stady: 'еНавчання',
    work: 'Робота',
    hobby: 'Хоббі'
  }
  return categories[categoryName];
};

function  getRemainingTime(dateTime) {
  const currentDate = new Date();
  const targetDate = new Date(dateTime);
  const diffInHours = Math.floor((targetDate - currentDate) / (3600 * 1000));
   const diffInMinutes = Math.floor((targetDate - currentDate) / (60 * 1000));

  if (diffInHours >= 24*30) {
    return `Залишилось ~ ${Math.floor(diffInHours / (24 * 30))} міс `;
  } else if (diffInHours >= 24){
    return `Залишилось ~ ${Math.floor(diffInHours / 24)} дні `;
  } else if (diffInHours >= 1){
    return `Залишилось ~ ${diffInHours} год `;
  } else if (diffInHours >= 0){
    return `Залишилось ~ ${diffInMinutes} хв `;
  } else {
    return 'Завдання протерміноване';
  }
};

function addTaskToPage(arr) {
  taskList.innerHTML = '';
  arr.forEach(el => {
    const category = getTaskNameCategory(el.taskCategory);
    const taskTime = getRemainingTime(el.dateTime);
    const expiredClass = taskTime === 'Завдання протерміноване' ? 'expired' : '';
    const doneClass = el.taskStatus === 'done' ? el.taskStatus : '';
    const checked = el.taskStatus === 'done' ? 'checked' : '';
    
    taskList.insertAdjacentHTML('afterbegin', `
      <li class="task-list__item">
      <div class="task ${el.category} ${expiredClass} ${doneClass}">
      <div class="task__head">
          <div class="task__check">
              <input
                  class="sr-only checkbox-input"
                  type="checkbox"
                  name="${el.id}"
                  id="${el.id}"
                  ${checked}
              >
              <label for="${el.id}" class="task__checkbox checkbox"></label>
              <div class="task__name">${el.text}</div>
          </div>
          <div class="task__actions">
              <button class="btn btn--icon btn--red task__btn task__btn--remove " type="button" title="Видалити"></button>
          </div>
      </div>
      <div class="task__info">
          <div class="task__category" title="${category}"></div>
          <div class="task__date">${taskTime} днів </div>
      </div>
  </div>
</li>
  `)
 });
};

function addMessage(type, text) {
  notifications.insertAdjacentHTML('afterbegin', `
    <div class="notification ${type}">
  <div class="notification__text">${text}</div>
</div>
  `);
  setTimeout(() => {
    notifications.firstElementChild.remove()}, 3000);
};

function markFieldsWithError(formName, groupClass) {
  const allGroups = formName.querySelectorAll(groupClass);
  allGroups.forEach(item => {
    if (!item.classList.contains('success')) {
      item.classList.add('error');
    }
  });
};

function clearForm(formName, groupClassName) {
  const allGroups = formName.querySelectorAll(groupClassName);
  allGroups.forEach(item => item.classList.remove('success'));
  myForm.reset();
};
 
function updateLocalStorage(items) {
  localStorage.setItem('allTasks', JSON.stringify(items));
}

function checkFormSuccess(formName, groupClass) {
  const allGroups = formName.querySelectorAll(groupClass);
  
  // allGroups.forEach(item => {
  //   if (!item.classList.contains('success')) {
  //     console.log('false');
  //     return false;
  //   }
  // });

  for (const group of allGroups) {
    if (!group.classList.contains('success')) {
      console.log('false');
      return false;
    }
  } 
   return true;
};


function handlerAddTaskBtn(e) {
  e.preventDefault();
  const error = document.querySelector('.form-error');
  if (checkFormSuccess(myForm, '.add-task__group')) {
    const newTask = createTask(myForm);
    error.classList.remove('show');
    allTasks.push(newTask);
    updateLocalStorage(allTasks);
    clearForm(myForm, '.add-task__group');
    addTaskToPage(allTasks);
    addMessage(msgType.add, msgText.add);
  } else {
    markFieldsWithError(myForm, '.add-task__group');
    error.classList.add('show');
  }
};

function changeTaskStatus(id) {
  allTasks.forEach(item => { 
    if (item.id === +id) {
      item.taskStatus = item.taskStatus !== 'done' ? 'done' : 'new';
      addMessage(msgType.done, msgText.done);
    }
  });
  updateLocalStorage(allTasks);
  addTaskToPage(allTasks);
};

function removeTask(id) {
  allTasks.forEach(item => { 
    if (item.id === +id) {
      const taskPosition = allTasks.indexOf(item);
      allTasks.splice(taskPosition, 1);
      addMessage(msgType.remove, msgText.remove);
    }
  });
  updateLocalStorage(allTasks);
  addTaskToPage(allTasks);
}

document.addEventListener('click', (e) => {
  const target = e.target;

  if (target.classList.contains('add-task__btn')) {
    handlerAddTaskBtn(e);
  }

  if (target.classList.contains('checkbox-input')) {
    console.log(target.id);
    target.closest('.task').classList.toggle('done');
    changeTaskStatus(target.id);
    console.log(allTasks);
  }

  if (target.classList.contains('task__btn--remove')) {
    const id = +target.closest('.task').querySelector('.checkbox-input').id;
    removeTask(id);
  }
});


// 1. додавання кнопки "редагувати" та "архів" до карток
// 2. при натисканні кнопки "редагування" з'являєтся поле для редагування та кноки
// 3. додати дію для кнопок "ок" та "відміна"
// 4. додави фільтри та лічильник завдань
// 4. валидація фільтрів 


