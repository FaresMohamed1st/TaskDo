class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.categories = new Set(this.todos.map(todo => todo.category).filter(Boolean));
        this.currentView = 'all';

        // Initialize DOM elements
        this.initializeDOMElements();
        this.initializeTheme();
        this.initializeEventListeners();
        this.updateCategoryList();
        this.renderTodos('');
    }

    initializeDOMElements() {
        // Forms and main containers
        this.todoForm = document.getElementById('todo-form');
        this.todoList = document.getElementById('todo-list');
        this.modal = document.getElementById('task-modal');
        this.sidebar = document.querySelector('.sidebar');

        // Form inputs
        this.todoInput = document.getElementById('todo-input');
        this.prioritySelect = document.getElementById('priority-select');
        this.recurringSelect = document.getElementById('recurring-select');
        this.dueDateInput = document.getElementById('due-date');
        this.categoryInput = document.getElementById('category-input');

        // Filters and sorting
        this.filterPriority = document.getElementById('filter-priority');
        this.sortSelect = document.getElementById('sort-select');

        // Buttons
        this.themeToggle = document.getElementById('theme-toggle');
        this.menuToggle = document.getElementById('menu-toggle');
        this.addTaskButton = document.getElementById('add-task-button');

        // Search elements
        this.searchInput = document.getElementById('search-tasks');
        this.clearSearchBtn = document.getElementById('clear-search');

        // Set minimum date for due date input
        this.dueDateInput.min = new Date().toISOString().split('T')[0];
    }

    initializeEventListeners() {
        // Form submission
        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
            this.closeModal();
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Mobile menu toggle
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());

        // Modal controls
        this.addTaskButton.addEventListener('click', () => this.openModal());
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });        // Filter and sort changes
        this.filterPriority.addEventListener('change', () => this.renderTodos(this.searchInput.value.toLowerCase().trim()));
        this.sortSelect.addEventListener('change', () => this.renderTodos(this.searchInput.value.toLowerCase().trim()));

        // Navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setCurrentView(e.currentTarget.getAttribute('href').substring(1));
            });
        });

        // Search functionality
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('active');
    }

    openModal() {
        this.modal.classList.add('active');
        this.todoInput.focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.todoForm.reset();
    } setCurrentView(view) {
        this.currentView = view;
        document.querySelector('.sidebar-nav li.active')?.classList.remove('active');
        document.querySelector(`.sidebar-nav a[href="#${view}"]`)?.parentElement.classList.add('active');
        document.querySelector('.main-header h2').textContent =
            view.charAt(0).toUpperCase() + view.slice(1) + ' Tasks';
        this.renderTodos(this.searchInput.value.toLowerCase().trim());
    }

    updateCategoryList() {
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        this.categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${category}">
                <i class="fas fa-tag"></i> ${category}
            </a>`;
            li.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                this.setCurrentView(category);
            });
            categoryList.appendChild(li);
        });
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        this.renderTodos(searchTerm);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.renderTodos();
        this.searchInput.focus();
    }

    filterTodos(searchTerm = '') {
        let filteredTodos = [...this.todos];
        const priority = this.filterPriority.value;

        // Filter by search term
        if (searchTerm) {
            filteredTodos = filteredTodos.filter(todo => {
                const searchFields = [
                    todo.text,
                    todo.category,
                    todo.priority,
                    todo.dueDate
                ].filter(Boolean);

                return searchFields.some(field =>
                    field.toLowerCase().includes(searchTerm)
                );
            });
        }

        // Filter by current view
        switch (this.currentView) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTodos = filteredTodos.filter(todo => todo.dueDate === today);
                break;
            case 'upcoming':
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                filteredTodos = filteredTodos.filter(todo => {
                    return todo.dueDate && todo.dueDate > new Date().toISOString().split('T')[0];
                });
                break;
            case 'recurring':
                filteredTodos = filteredTodos.filter(todo => todo.recurring && todo.recurring !== 'none');
                break;
            default:
                if (!['all'].includes(this.currentView)) {
                    filteredTodos = filteredTodos.filter(todo => todo.category === this.currentView);
                }
        }

        // Filter by priority
        if (priority !== 'all') {
            filteredTodos = filteredTodos.filter(todo => todo.priority === priority);
        }

        // Sort todos
        const sortBy = this.sortSelect.value;
        filteredTodos.sort((a, b) => {
            switch (sortBy) {
                case 'due-date':
                    return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                default:
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
            }
        });

        return filteredTodos;
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        const priority = this.prioritySelect.value;
        const recurring = this.recurringSelect.value;
        const dueDate = this.dueDateInput.value;
        const category = this.categoryInput.value.trim();

        if (text) {
            const todo = {
                id: Date.now(),
                text,
                priority,
                recurring: recurring !== 'none' ? recurring : null,
                dueDate,
                category,
                completed: false,
                dateAdded: new Date().toISOString()
            };

            this.todos.push(todo);

            if (category && !this.categories.has(category)) {
                this.categories.add(category);
                this.updateCategoryList();
            } this.saveTodos();
            this.renderTodos(this.searchInput.value.toLowerCase().trim());
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos(this.searchInput.value.toLowerCase().trim());
    }

    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;

            if (todo.recurring && todo.completed) {
                this.scheduleNextRecurrence(todo);
            }

            this.saveTodos();
            this.renderTodos();
        }
    }

    scheduleNextRecurrence(todo) {
        const nextDueDate = new Date(todo.dueDate);
        switch (todo.recurring) {
            case 'daily':
                nextDueDate.setDate(nextDueDate.getDate() + 1);
                break;
            case 'weekly':
                nextDueDate.setDate(nextDueDate.getDate() + 7);
                break;
            case 'monthly':
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                break;
        }
        todo.dueDate = nextDueDate.toISOString().split('T')[0];
        todo.completed = false;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    } renderTodos(searchTerm = '') {
        this.todoList.innerHTML = '';
        const filteredTodos = this.filterTodos(searchTerm);

        filteredTodos.forEach(todo => {
            const todoElement = document.createElement('div');
            todoElement.className = `todo-item priority-${todo.priority}${todo.completed ? ' completed' : ''}`;

            const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No due date';
            const recurringIcon = todo.recurring ?
                `<span class="recurring-icon" title="${todo.recurring}"><i class="fas fa-redo"></i></span>` : '';

            todoElement.innerHTML = `
                <div class="todo-content">
                    <div class="todo-text">
                        ${todo.text}
                        ${recurringIcon}
                    </div>
                    <div class="todo-meta">
                        <span><i class="far fa-calendar"></i> ${dueDate}</span>
                        ${todo.category ?
                    `<span class="category-tag"><i class="fas fa-tag"></i> ${todo.category}</span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button onclick="app.toggleTodo(${todo.id})" class="btn-icon">
                        <i class="fas ${todo.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="app.deleteTodo(${todo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            this.todoList.appendChild(todoElement);
        });

        // Show empty state if no todos
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks found</p>
                </div>
            `;
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateThemeIcon(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeIcon('dark');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize the app
const app = new TodoApp();
