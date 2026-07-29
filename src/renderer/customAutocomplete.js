
export class CustomAutocomplete {
    constructor(inputElement, optionsArray) {
        this.input = inputElement;
        this.options = optionsArray; 
        this.dropdown = null;
        this.selectedIndex = -1;
        this.isSelecting = false;
        this.eventListeners = [];

        this.init();
    }

    init() {
        this.dropdown = document.createElement('ul');
        this.dropdown.className = 'custom-autocomplete-dropdown';
        this.dropdown.style.display = 'none';

        const parent = this.input.parentNode;
    
        // 🔥 ГАРАНТИРОВАННО делаем родителя "якорем" для абсолютного позиционирования
        parent.style.position = 'relative';
        
        // Добавляем прямо в родителя инпута (например, в label.calculator-field)
        // Благодаря position: relative у родителя, он будет идеально следовать за инпутом
        parent.appendChild(this.dropdown);

         // 🔥 Добавляем проверку флага в обработчик focus
        this._addListener(this.input, 'focus', () => {
            if (!this.isSelecting) {
                this.filter();
            }
        });

        this._addListener(this.input, 'input', () => this.filter());
        this._addListener(this.input, 'keydown', (e) => this.handleKeydown(e));
        
        this._addListener(document, 'click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.close();
            }
        });
    }

    _addListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    updateOptions(newOptionsArray) {
        this.options = newOptionsArray;
        this.filter();
    }

    filter() {
        const query = this.input.value.toLowerCase().trim();
            this.selectedIndex = -1;
            this.dropdown.innerHTML = '';

            const filtered = this.options.filter(item => 
                item.name.toLowerCase().includes(query)
            );

            if (filtered.length > 0) {
                filtered.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.className = 'custom-autocomplete-item';
                    li.innerHTML = `<span>${item.name}</span> <span class="price">${item.price.toLocaleString("ru-RU")} руб.</span>`;
                    li.dataset.index = index;
                    li.dataset.value = item.name;
                    
                    li.addEventListener('click', () => this.select(item.name));
                    li.addEventListener('mouseenter', () => this.highlight(index));
                    
                    this.dropdown.appendChild(li);
                });
                this.open();
            } else {
                this.close();
            }
    }

    handleKeydown(e) {
        const items = this.dropdown.querySelectorAll('li');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % items.length;
            this.highlight(this.selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
            this.highlight(this.selectedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                this.select(items[this.selectedIndex].dataset.value);
            }
        } else if (e.key === 'Escape') {
            this.close();
        }
    }

    highlight(index) {
        const items = this.dropdown.querySelectorAll('li');
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
            if (i === index) item.scrollIntoView({ block: 'nearest' });
        });
    }

    select(value) {
         // 🔥 Устанавливаем флаг, чтобы предотвратить повторное открытие списка
        this.isSelecting = true;

        this.input.value = value;
        this.close();
        this.input.dispatchEvent(new Event('change'));

        // Снимаем флаг через небольшую задержку
        setTimeout(() => {
            this.isSelecting = false;
        }, 100);
    }

    open() { this.dropdown.style.display = 'block'; }
    
    close() { 
        this.dropdown.style.display = 'none';
        this.dropdown.innerHTML = ''; // 🔥 Очищаем содержимое для надежности 
        this.selectedIndex = -1; 
    }

    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
    }
}