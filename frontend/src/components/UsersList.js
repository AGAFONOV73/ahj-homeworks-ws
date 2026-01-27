export default function UsersList(currentUser, users = []) {
    const container = document.createElement('div');
    container.className = 'chat__users';
  
    const header = document.createElement('div');
    header.className = 'chat__users-header';
    header.textContent = 'Users';
    container.append(header);
  
    users.forEach((user) => {
      const userEl = document.createElement('div');
      userEl.className = 'chat__user';
      if (user === currentUser) userEl.classList.add('chat__user--me');
      
      const avatar = document.createElement('div');
      avatar.className = 'chat__user-avatar';
      
      const nameEl = document.createElement('div');
      nameEl.className = 'chat__user-name';
      nameEl.textContent = user;
      
      userEl.append(avatar, nameEl);
      container.append(userEl);
    });
  
    return container;
  }