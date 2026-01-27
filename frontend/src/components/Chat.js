import UsersList from './UsersList.js';
import Message from './Message.js';

export default function Chat({ ws, nickname }) {
  const container = document.createElement('div');
  container.className = 'chat';

  let users = [];
  const usersContainer = UsersList(nickname, users);
  
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'chat__messages';

  const inputContainer = document.createElement('div');
  inputContainer.className = 'chat__input-container';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type your message here';
  input.className = 'chat__input';

  const button = document.createElement('button');
  button.textContent = 'Send';
  button.className = 'chat__button';

  inputContainer.append(input, button);

  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat__container';
  chatContainer.append(usersContainer, messagesContainer);

  container.append(chatContainer, inputContainer);

  const addMessage = (from, text) => {
    const msg = Message(from, text, from === nickname);
    messagesContainer.append(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  ws.on('message', (data) => {
    addMessage(data.from, data.text);
  });

  ws.on('users', (data) => {
    users = data.users;
    usersContainer.replaceChildren();

    const header = document.createElement('div');
    header.className = 'chat__users-header';
    header.textContent = 'Users';
    usersContainer.append(header);

    users.forEach((user) => {
      const userEl = document.createElement('div');
      userEl.className = 'chat__user';
      if (user === nickname) userEl.classList.add('chat__user--me');
      
      const avatar = document.createElement('div');
      avatar.className = 'chat__user-avatar';
      
      const nameEl = document.createElement('div');
      nameEl.className = 'chat__user-name';
      nameEl.textContent = user;
      
      userEl.append(avatar, nameEl);
      usersContainer.append(userEl);
    });
  });

  button.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      ws.send({ type: 'message', text });
      input.value = '';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') button.click();
  });

  return container;
}