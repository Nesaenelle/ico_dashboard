var API = new API_CONSTRUCTOR();

var find = function(selector, context) {
    return context ? context.querySelector(selector) : document.querySelector(selector);
};

var findAll = function(selector, context) {
    return context ? context.querySelectorAll(selector) : document.querySelectorAll(selector);
};

var addEvent = function(elem, type, fn) {
    elem.addEventListener(type, fn, false);
};

var toggleClass = function(elem, className) {
    if (elem.classList.contains(className)) {
        elem.classList.remove(className);
    } else {
        elem.classList.add(className);
    }
};

var addClass = function(elem, className) {
    elem.classList.add(className);
};

var removeClass = function(elem, className) {
    elem.classList.remove(className);
};

function API_CONSTRUCTOR() {

};

API_CONSTRUCTOR.prototype.add = function(name, constructor, methods) {
    if (!name || typeof name !== 'string') {
        throw new Error('API ERROR');
    }

    for (var method in methods) {
        constructor.prototype[method] = methods[method];
    }

    this[name] = new constructor();
};

API.add('themeSwitcher', function() {
    var checkbox = find('[data-theme-switcher] input');
    var self = this;
    addEvent(checkbox, 'change', function() {
        self.changeTheme(checkbox);
    });
}, {
    changeTheme: function(checkbox) {
        if (checkbox.checked) {
            removeClass(document.body, 'light-theme');
        } else {
            addClass(document.body, 'light-theme');
        }
    }
});

API.add('tabs', function() {
    var tabs = findAll('[data-tabs]');
    tabs.forEach(function(context) {
        var items = findAll('[data-tabs-item]', context);
        var contents = findAll('[data-tabs-content]', context);
        items.forEach(function(tab) {
            addEvent(tab, 'click', function(e) {

                items.forEach(function(a) { removeClass(a, 'active') });
                addClass(tab, 'active');
                var id = e.currentTarget.getAttribute('data-tabs-item');
                var content = find('[data-tabs-content="' + id + '"]', context);
                contents.forEach(function(a) { removeClass(a, 'active') });
                if (content) {
                    addClass(content, 'active');
                }
            });

        });
    });
});


API.add('dropdown', function() {
    var self = this;
    this.dropdowns = findAll('[data-dropdown]');
    this.dropdowns.forEach(function(dropdown) {
        var valueElem = find('[data-dropdown-value]', dropdown);
        var contentElem = find('[data-dropdown-content]', dropdown);
        var items = findAll('[data-dropdown-item]', dropdown);

        addEvent(valueElem, 'click', function(e) {
            e.stopPropagation();
            self.closeAll();
            toggleClass(dropdown, 'opened');
        });

        items.forEach(function(item) {
            addEvent(item, 'click', function() {
                valueElem.innerHTML = this.innerHTML;
                removeClass(dropdown, 'opened');
            });
        });

        window.addEventListener('click', function(e) {
            if (dropdown.classList.contains('opened') && !contentElem.contains(e.target)) {
                removeClass(dropdown, 'opened');
            }
        }, false);
    });
}, {
    closeAll: function() {
        this.dropdowns.forEach(function(dropdown) { removeClass(dropdown, 'opened') });
    }
});



API.add('modal', function() {
    var self = this;
    this.popupBtns = findAll('[data-modal-open]');
    this.modalOverlay = find('#modal-overlay');
    this.closeBtns = findAll('.js-close-modal');
    this.activeModal;

    this.popupBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var id = e.currentTarget.getAttribute('data-modal-open');
            e.stopPropagation();
            self.openModal(id);
        });
    });


    this.closeBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            self.activeModal.classList.remove('opened');
            self.modalOverlay.classList.remove('opened');
        });
    });


    window.addEventListener('click', function(e) {
        if (self.activeModal && !self.activeModal.querySelector('.modal-body').contains(e.target)) {
            self.closeModal();
        }
    }, false);



}, {
    closeModal: function(e) {
        if (this.activeModal) {
            this.activeModal.classList.remove('opened');
            this.modalOverlay.classList.remove('opened');
        }
    },

    openModal: function(id) {
    	var self = this;
        this.closeModal();
        this.modalOverlay.classList.add('opened');
        this.activeModal = find('.modal[data-modal="' + id + '"]');
        this.activeModal.classList.add('opened');

        if (id === 'sign-in') {
            var formInst = new Form(find('#sign-in-form', this.activeModal));
            formInst.onSubmit(function() {
                addClass(find('.dashboard-auth'), 'authorized');
                self.closeModal();
            });
        }
    }

});


function Form(form) {
    var self = this;
    this.controls = [];
    this.form = form;
    this.subscriptions = [];

    form.querySelectorAll('input').forEach(function(input) {
        self.controls.push(new Input(input, self));
    });

    form.onsubmit = function(e) {
        e.preventDefault();
        var focusState = false;

        self.controls.forEach(function(ctrl) {
            if (!focusState) {
                ctrl.input.focus();
                if (!ctrl.validate()) {
                    focusState = true;
                }
            }
        });

        var errors = self.controls.reduce(function(a, b) {
            b = b.valid ? 0 : 1;
            return a + b;
        }, 0);

        if (errors === 0) {
            self.subscriptions.forEach(function(fn) { fn.call(self) });
            self.controls.forEach(function(ctrl) {
                ctrl.input.value = '';
                ctrl.clear();
            })
        }
    };
};

Form.prototype.validate = function() {
    this.controls.forEach(function(ctrl) {
        ctrl.validate()
    });
};

Form.prototype.onSubmit = function(fn) {
    this.subscriptions.push(fn);
};


function Input(input, parent) {
    var self = this;
    this.parent = parent;
    this.msg = document.createElement('div');
    this.pattern = getPattern(input.getAttribute('data-pattern'));
    this.input = input;
    this.valid = false;
    this.value = input.value;
    input.oninput = function() {
        self.value = this.type === 'checkbox' ? this.checked : this.value;
        self.parent.validate();
    };
}

Input.prototype.validate = function() {
    if (this.input.getAttribute('data-pass-confirm')) {
        if (this.input.value === this.parent.form.querySelector('[data-pattern="password"]').value) {
            this.removeError();
        } else {
            this.addError();
        }
    } else {
        if ((this.input.type === 'text' || this.input.type === 'password') && this.pattern.test(this.input.value) || this.input.checked) {
            this.removeError();
        } else {
            this.addError();
        }
    }

    return this.valid;
};

Input.prototype.addError = function() {
    this.input.classList.add('invalid');
    this.input.classList.remove('valid');
    this.msg.className = 'input-msg invalid';
    this.msg.innerHTML = 'Enter the correct email';
    this.input.parentNode.appendChild(this.msg);
    this.valid = false;
};

Input.prototype.removeError = function() {
    this.input.classList.add('valid');
    this.input.classList.remove('invalid');
    this.msg.className = 'input-msg valid';
    this.msg.innerHTML = 'This is correct email';
    this.input.parentNode.appendChild(this.msg);
    this.valid = true;
};

Input.prototype.clear = function() {
    this.input.classList.remove('valid');
    this.input.classList.remove('invalid');
    this.input.parentNode.removeChild(this.msg);
    this.valid = false;
};

function getPattern(o) {
    var pattern;
    switch (o) {
        case 'email':
            pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            break;

        case 'login':
            pattern = /^(?=.*[A-Za-z0-9]$)[A-Za-z][A-Za-z\d.-]{0,19}$/;
            break;

        case 'password':
            pattern = /^(?=.*[a-zA-Z0-9])(?=.*).{7,40}$/;
            break;

        case 'checkbox':
            pattern = /^on$/;
            break;
    }

    return pattern;
}