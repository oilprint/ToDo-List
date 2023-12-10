const myForm = document.querySelector('.form'), 
      wrapper = document.querySelector('.wrapper'),
      formFields = document.querySelectorAll('.form-field'),
      sortSection = document.querySelector('.sorting'),
      sortCount = document.querySelector('.sorting__count'),
      sortingBtns = document.querySelectorAll('.sort-radio__input'),
      taskList = document.querySelector('.task-list'),
      notifications = document.querySelector('.notifications'),
      nowDate = Date.now(),
      statusTaskList = [],
      categoryTaskList = [],
      timeTaskList = [],
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
  done: 'done-task',
  archive: 'archive-task'
};

const msgText = {
  add: 'Додано нове завдання',
  remove: 'Завдання видалено',
  done: 'Завдання виконано',
  archive: 'Завдання додано до архіву',
  unArchive: 'Завдання видаленно з архіву',
};
const yearInMs = 365 *24 * 3600 *1000;

addFormValidation(myForm);
addTaskToPage(allTasks);

addFilters();
addFiltersEvents(sortingBtns);


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
  if (inputDate === currentDate && inputTime < currentTime + 30 * 60000) {
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
  const inputDate = Date.parse(target.value) ;
  const currentTime = convertStringTimeToMS(`${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:${new Date().getMilliseconds()}`);
  const currentDate = Date.now() - currentTime;
  const timeDiff = convertStringTimeToMS(myForm.taskTime.value) - currentTime;

  console.log(Date.parse(target.value));
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
    inArchive: false,
    taskStatus: 'new'
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

function getRemainingTime(dateTime) {
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
    const archiveClass = el.inArchive === true ? 'archive' : '';
    const checked = el.taskStatus === 'done' ? 'checked' : '';
    
    taskList.insertAdjacentHTML('afterbegin', `
      <li class="task-list__item">
      <div class="task ${el.category} ${expiredClass} ${doneClass} ${archiveClass}">
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
          <button class="btn btn--icon btn--orange task__btn task__btn--edit" type="button" title="Редагувати"></button>
          <button class="btn btn--icon btn--red task__btn task__btn--remove" type="button" title="Видалити"></button>
        </div>
      </div>
      <div class="task__info">
          <div class="task__category" title="${category}"></div>
          <div class="task__date">${taskTime}</div>
      </div>
      <button class="btn btn--icon btn--gray task__btn task__btn--archive" type="button" title="Архівувати/Вилучити"></button>
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
    sortCount.textContent = allTasks.length;
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

function changeArchiveStatus(id) {
  allTasks.forEach(item => { 
    if (item.id === +id) {
      item.inArchive = item.inArchive === true ? false : true;
         if (item.inArchive === true) {
          addMessage(msgType.archive, msgText.archive);
      } else {
        addMessage(msgType.archive, msgText.unArchive);
      };
    };
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
};

function textOfTask(id) {
  let text;
  allTasks.forEach(item => { 
    if (item.id === +id) {
      text = item.text;   
    }
  });
  return text;
};

function addFilters() {
  if (allTasks.length > 1) {
     sortSection.classList.remove('hide');
     allTasks.forEach(item => {
      statusTaskList.push(item);
      categoryTaskList.push(item);
      timeTaskList.push(item);
     })
     sortCount.textContent = allTasks.length;
     sortingBtns.forEach(item => {
        if(item.getAttribute('id') === 'categorySort[all]') {
          item.checked = true;
        } else if (item.getAttribute('id') === 'timeSort[all]') {
          item.checked = true;
        };
      });
  };
};

function addFiltersEvents(btns) {
  btns.forEach(item => {
    item.addEventListener('click', (e) => {
      let targetSort = e.target.getAttribute('id');
      checkAndApplySort(targetSort);
    })
  })
};

function checkAndApplySort(sortValue) {
  switch (sortValue) {
    case 'statusSort[all]':
      sortTasksByStatus(allTasks, 'all');
      break;
    case 'statusSort[undone]':
      sortTasksByStatus(allTasks,'new');
      break;     
    case 'statusSort[done]':
      sortTasksByStatus(allTasks, 'done');
      break;      
      case 'statusSort[archive]':
        sortTasksByStatus(allTasks,'archive');    
      break;
    case 'categorySort[all]':
      sortTasksByCategory(statusTaskList, 'all');    
      break;
    case 'categorySort[urgent]':
      sortTasksByCategory(statusTaskList, 'urgent');
      break;
    case 'categorySort[study]':
      sortTasksByCategory(statusTaskList, 'study');
      break;
    case 'categorySort[work]':
      sortTasksByCategory(statusTaskList, 'work');
      break;
    case 'categorySort[hobby]':
      sortTasksByCategory(statusTaskList, 'hobby');
      break;
    case 'timeSort[all]':
      sortTasksByTime('all');
      break;
    case 'timeSort[new]':
      sortTasksByTime('new');;
      break;
    case 'timeSort[expired]':
      sortTasksByTime('expired');
      break;
    case 'timeSort[oneWeek]':
      sortTasksByTime('oneWeek');
      break;
    case 'timeSort[oneMonth]':
      sortTasksByTime('oneMonth');
      break;
    case 'timeSort[closest]':
      sortTaskFromClosest('closest');
      break;
    case 'timeSort[distance]':
      sortTaskFromClosest('distance');
      break;
  
    default:
      break;
  }
};


function sortTaskFromClosest(value) {
  let closestTaskList = [];
  if (value === 'closest') {
    closestTaskList = [...timeTaskList].sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime));
  } else if (value === 'distance') {
    closestTaskList = [...timeTaskList].sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime));
  }
  
  addTaskToPage(closestTaskList);
  sortCount.textContent = closestTaskList.length;
}

function sortTasksByStatus(arr, sortValue) {
   statusTaskList.splice(0);
  if (sortValue === 'all') {
    allTasks.forEach(item => {
      statusTaskList.push(item);
    });
  } else if (sortValue === 'archive') {
    const sortTasksList = arr.filter(item => item.inArchive === true);
    sortTasksList.forEach(item => statusTaskList.push(item));
  } else {
    const sortTasksList = arr.filter(item => item.taskStatus === sortValue);
    sortTasksList.forEach(item => {
      if (item.inArchive !== true) {
       statusTaskList.push(item);
      }
    });
  };

  sortingBtns.forEach(item => {
    if (item.name === 'categorySort') {
      if (item.checked === true) {
        sortTasksByCategory(statusTaskList, item.getAttribute('value'));
      };
    };
  });

  sortingBtns.forEach(item => {
    if (item.name === 'timeSort') {
      if (item.checked === true) {
        sortTasksByTime(item.getAttribute('value'));
      };
    };
  });

  addTaskToPage(timeTaskList);
  sortCount.textContent = timeTaskList.length;
};

function sortTasksByCategory(arr, sortValue) {
  categoryTaskList.splice(0);
  if(sortValue !== 'all') {
    const sortTasksList = arr.filter(item => item.category === sortValue);
    sortTasksList.forEach(item => {
      categoryTaskList.push(item);  
    });
  } else {
    statusTaskList.forEach(item => {
        categoryTaskList.push(item);  
    });   
  };

  sortingBtns.forEach(item => {
    if (item.name === 'timeSort') {
      if (item.checked === true) {
        sortTasksByTime(item.getAttribute('value'));
      };
    };
  });

  addTaskToPage(timeTaskList);
  sortCount.textContent = timeTaskList.length;
};

function sortTasksByTime(num) {
  timeTaskList.splice(0);
  categoryTaskList.forEach(item => {
    const chosenDate = Date.parse(item.dateTime);
    const datesDiff = chosenDate - nowDate;
    const daysDiff = Math.floor(datesDiff / (24 * 3600 * 1000));
    switch (num) {
      case 'all':
        timeTaskList.push(item);
      break;
      case 'new':
        if (daysDiff >= 0 && daysDiff < 1) {
          timeTaskList.push(item);
        };
        break;
      case 'expired':
        if (daysDiff < 0) {
          timeTaskList.push(item);
        }
        break;
      case 'oneWeek':
        if (daysDiff < 7 && daysDiff >= 0 ) {
          timeTaskList.push(item);
        }
        break;
      case 'oneMonth':
        if (daysDiff < 30 && daysDiff >= 0 ) {
          timeTaskList.push(item);
        }
        break;
    
      default:
        break;
    }
  });
  addTaskToPage(timeTaskList);
  sortCount.textContent = timeTaskList.length; 
};

document.addEventListener('click', (e) => {
  const target = e.target;

  if (target.classList.contains('add-task__btn')) {
    handlerAddTaskBtn(e);
  };

  if (target.classList.contains('checkbox-input')) {
    target.closest('.task').classList.toggle('done');
    changeTaskStatus(target.id);
    console.log(allTasks);
  };

  if (target.classList.contains('task__btn--remove')) {
    const id = +target.closest('.task').querySelector('.checkbox-input').id;
    removeTask(id);
  };

  if (target.classList.contains('task__btn--edit')) {
    
    const id = +target.closest('.task').querySelector('.checkbox-input').id;

    const text = textOfTask(id);

    target.closest('.task').insertAdjacentHTML('afterbegin', `
      <form class="form form--edit" name="editTask">
        <div class="add-task">
          <div class="add-task__group">
            <textarea class="form-field" id="task-text" name="taskText">${text}</textarea>
            <div class="form-error-msg"></div>
        </div>
        <div class="d-flex j-end g-10">
            <button class="btn btn--sm btn--gray js_reject-changes" type="button">Відхилити</button>
            <button class="btn btn--sm btn--green js_save-changes" type="button">OK</button>
        </div>
      </div>
    </form>
    `);
    const editForm = target.closest('.task').querySelector('.form');
    addFormValidation(editForm);
  };

  if (target.classList.contains('js_save-changes')) {
    const id = +target.closest('.task').querySelector('.checkbox-input').id;
    const editForm = target.closest('.task').querySelector('.form');

    const editText = editForm.querySelector('#task-text').value;
    console.log(editText);

    allTasks.forEach(item => { 
    if (item.id === +id) {
      item.text = editText;
    }
  });
    updateLocalStorage(allTasks);
    addTaskToPage(allTasks);
    target.closest('.add-task').remove();
  };

  if (target.classList.contains('js_reject-changes')) {
    target.closest('.add-task').remove();
  };

  if (target.classList.contains('task__btn--archive')) {
    const id = +target.closest('.task').querySelector('.checkbox-input').id;
    console.log(id);

    target.closest('.task').classList.toggle('archive');
    changeArchiveStatus(id);
  };

});

