export default function Modal({ onSubmit, error }) {
    const container = document.createElement('div');
    container.className = 'modal';
  
    container.innerHTML = `
      <div class="modal__content">
        <h2>Выберите псевдоним</h2>
        <input type="text" class="modal__input" placeholder="Введите ник" />
        <button class="modal__button">Продолжить</button>
        <p class="modal__error" style="color: red; display: none;"></p>
      </div>
    `;
  
    const input = container.querySelector('.modal__input');
    const button = container.querySelector('.modal__button');
    const errorEl = container.querySelector('.modal__error');
  
    if (error) {
      errorEl.textContent = error;
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  
    button.addEventListener('click', () => {
      const nickname = input.value.trim();
      if (nickname) {
        onSubmit(nickname);
      }
    });
  
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        button.click();
      }
    });
  
    return container;
  }