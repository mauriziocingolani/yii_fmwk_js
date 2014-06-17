/**
 * Application.js
 * 
 * Contiene tutto il codice del framework.
 * @version 1.0.20
 */

/**
 * Espone un unico metodo start() per inizializzare alcuni parametri
 * e fare sparire lo schermo di preload.
 * @type object
 */
var Application = {
    /**
     * Assegna i parametri di default per il datepicker, esegue la callback (se definita)
     * e quindi fa scomparire lo schermo di preload.
     * @param {function} callback Funzione da eseguire prima dell'eliminazione dello schermo
     */
    start: function(callback) {
        /* Inizializzazioni */
        $.datepicker.setDefaults({
            //regional
            closeText: 'Chiudi',
            prevText: 'Mese precedente',
            nextText: 'Mese successivo',
            currentText: 'Oggi',
            monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
            monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
                'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
            dayNames: ['Domenica', 'Luned&#236', 'Marted&#236', 'Mercoled&#236', 'Gioved&#236', 'Venerd&#236', 'Sabato'],
            dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
            dayNamesMin: ['Do', 'Lu', 'Ma', 'Me', 'Gio', 'Ve', 'Sa'],
            dateFormat: 'dd/mm/yy',
            firstDay: 1,
            //
            changeMonth: true,
            changeYear: true,
            dayNames: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
                    showAnim: 'slide',
            showButtonPanel: true,
            showOtherMonths: false,
            showWeek: true
        });
        $.datepicker.setDefaults($.datepicker.regional[ "it" ]);
        /* Callback */
        if (callback !== undefined) {
            callback();
        }
        /* Tooltips */
        $("[data-toggle='tooltip']").tooltip();
        /* Pulsanti scelta file */
        $(document)
                .on('change', '.btn-file :file', function() {
                    var input = $(this);
                    input.trigger('fileselect', [input[0].files[0]]);
                });
        /* Via preloader */
        $('#status').fadeOut(1500);
        $('#preloader').delay(500).fadeOut(1000);
        $('body').delay(1000).css({'overflow': 'visible'});
    },
    noDocumentDragAndDrop: function() {
        $(document).on('dragenter', function(e) {
            e.stopPropagation();
            e.preventDefault();
        });
        $(document).on('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
        });
        $(document).on('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();
        });
    }
}
/**
 * Gestisce una form di inserimento dati.
 * Inizializza le proprietà {@link name} con il nome passato come parametro,
 * {@link fields} con la lista di oggetti {@link Field} che rappresentano i campi
 * della form (marcati con la classe 'form-control'),
 * {@link message} con l'elemento di id '#[nome form]_message'.
 * @param {string} formName Nome della form e prefisso dei campi (default: nome del modello php)
 * @param {boolean} validateOnChange True per validare i campi dopo ogni modifica
 * @param {object} Eventuale lista di parametri da passare alla form
 * @returns {Form} Oggetto Form
 */
var Form = function(formName, validateOnChange, options) {
    this.name = formName;
    this.options = options;
    var fields = {};
    var form = this;
    $('#' + formName + ' .form-control, #' + formName + ' .form-control-static, #' + formName + ' .checkbox').each(function() {
        fields[$(this).attr('id')] = new Field(form, $(this), validateOnChange);
    });
    this.fields = fields;
    this.message = $('#' + formName + '_message');
}
/**
 * Esegue la validazione dei campi della form e ne imposta lo stato.
 * @returns {boolean} Validità della form
 */
Form.prototype.validate = function() {
    var valid = true;
    var validation;
    $.each(this.fields, $.proxy(function(key, value) {
        validation = value.validate();
        value.setErrorStatus(validation);
        if (validation !== true)
            valid = false;
    }, this));
    return valid;
}
/**
 * Cerca e restituisce il campo indicato nella lista dei campi della form.
 * @param {string} fieldName
 * @returns {Field} Oggetto field corrispondente 
 */
Form.prototype.getField = function(fieldName) {
    return this.fields[this.name + '_' + fieldName];
}

/**
 * Restituisce il valore contenuto nel campo, usando indistintamente
 * il metodo .val() di jQuery (tramite il metodo getValue() dell'oggetto FIeld).
 * @param {string} fieldName Nome del campo
 * @returns {string} Valore contenuto nel campo
 */
Form.prototype.getFieldValue = function(fieldName) {
    return this.getField(fieldName).getValue();
}
/**
 * Imposta il valore contenuto nel campo, usando indistintamente
 * il metodo .val() di jQuery (tramite il metodo setValue() dell'oggetto FIeld).
 * @param {string} fieldName Nome del campo
 * @param {mixed} value Valore da assegnare al campo
 * @returns {string} Valore contenuto nel campo
 */
Form.prototype.setFieldValue = function(fieldName, value) {
    this.getField(fieldName).setValue(value);
}

/**
 * Assegna al campo la callback da eseguire al verificarsi dell'evento specificato.
 * E' un wrapper per il metodo $.on().
 * @param {string} fieldName Nome del campo
 * @param {string} event Evento da impstare ('click',...)
 * @param {function} callable Callback da invocare
 */
Form.prototype.setFieldEvent = function(fieldName, event, callable) {
    this.fields[this.name + '_' + fieldName].field.on(event, callable);
}

/**
 * Costruisce e inizializza un campo partendo dal tag html (resituito dal selettore jQuery).
 * 
 * Proprietà impostate in base all'id del tag:
 * - {@link field} : tag originale
 * - {@link id} : id del tag ('#[nome form]_[nome campo]')
 * - {@link div} : div esterna che contiene etichetta, campo e messaggio di errore (id: '#[nome form]_[nome campo]_div')
 * - {@link error} : div che contiene il messaggio di errore (id: '#[nome form]_[nome campo]_error')
 * - {@link errormessage} : span che contiene il testo di errore (id: '#[nome form]_[nome campo]_errormessage')
 * 
 * Attributi impostati in base agli attributi del tag:
 * - {@link required} : true se è presente l'attributo 'data-required'
 * - {@link regexp} : se è presente l'attributo 'data-regexp' contiene un oggetto Regex construito con il contenuto dell'attributo
 * - {@link date} : true se è presente l'attributo 'data-date'
 * - {@link time} : se è presente l'attributo 'data-time' contiene la regex per la validazine dell'orario
 * 
 * I campi di tipo date e time vengono inizializzati con .datepicker e .timepicker rispettivamente.
 * 
 * Se richiesto dal parametro validateOnChange associa la funzione {@link validate} all'evento 'change' del campo.
 * 
 * @param {object} form Oggetto Form cui il campo appartiene (usata solo per campi 'compare')
 * @param {string} field Tag del campo (restituito da selettore jQuery)
 * @param {boolean} validateOnChange True per impostare la validazione automatica a ogni modifica
 * @returns {Field} Oggetto FIeld
 */
var Field = function(form, field, validateOnChange) {
    this.field = field;
    this.id = field.attr('id');
    this.div = $('#' + field.attr('id') + '_div');
    this.error = $('#' + field.attr('id') + '_error');
    this.errormessage = $('#' + field.attr('id') + '_errormessage');
    if (field.attr('data-required'))
        this.required = true;
    if (field.attr('data-regexp')) {
        this.regexp = new RegExp(field.attr('data-regexp'));
    }
    if (field.attr('data-date')) {
        this.field.datepicker();
        this.date = true;
    }
    if (this.field.attr('data-time')) {
        this.field.timepicker({
            hourText: 'Ora',
            minuteText: 'Minuto',
            nowButtonText: 'Adesso',
            showNowButton: true,
        });
        this.time = new RegExp(field.attr('data-time'));
    }
    if (this.field.attr('data-combo-select')) {
        this.combo = true;
        this.values = $('#' + this.id + '_data li');//No proprietà!!!
        var options = new Array;
        for (var i = 0, n = this.values.length; i < n; i++) {
            options.push($(this.values[i]).html());
        }
        this.field.autocomplete({
            source: options,
            minLength: 0,
            select: $.proxy(function(event, ui) {
                this.setErrorStatus(this.validate(ui.item ? ui.item.label : ''));
            }, this),
            change: $.proxy(function(event, ui) {
                this.setErrorStatus(this.validate(ui.item ? ui.item.label : ''));
            }, this)
        });
        $('#' + this.id + '_button').on('click', $.proxy(function() {
            this.field.autocomplete('search', '');
            this.field.focus();
        }, this));
        $('#' + this.id + '_data').remove();
    }
    if (this.field.attr('data-number')) {
        this.number = this.field.attr('data-number');
        this.min = this.number == 'int' ? parseInt(this.field.attr('data-min'), 10) : parseFloat(this.field.attr('data-min'));
        this.minMessage = this.field.attr('data-min-message');
        this.max = this.number == 'int' ? parseInt(this.field.attr('data-max'), 10) : parseFloat(this.field.attr('data-max'));
        this.maxMessage = this.field.attr('data-max-message');
    }
    if (this.field.attr('data-compare')) {
        this.form = form;
        this.compare = this.field.attr('data-compare');
        this.compareOperator = this.field.attr('data-compare-operator');
        this.compareMessage = this.field.attr('data-compare-message');
    }
    if (this.field.attr('data-uppercase') || this.field.attr('data-lowercase') || this.field.attr('data-propercase') || this.field.attr('data-trim')) {
        this.field.on('blur', $.proxy(function(event) {
            var t = $('#' + event.target.id);
            var value = t.val();
            if (this.field.attr('data-uppercase')) {
                value = value.toUpperCase();
            }
            if (this.field.attr('data-lowercase')) {
                value = value.toLowerCase();
            }
            if (this.field.attr('data-propercase')) {
                value = value.toProperCase();
            }
            if (this.field.attr('data-trim')) {
                value = value.trim();
            }
            t.val(value);
            t = null;
        }, this));
    }
    if (this.field.attr('data-sn-editor')) {
        var opts = form.options == undefined ? {} : (form.options.sn || {});
        if (validateOnChange) {
            opts.onblur = $.proxy(function() {
                this.setErrorStatus(this.validate());
            }, this);
        }
        this.sn = this.field.summernote(opts);
    }
    if (validateOnChange) {
        if (!this.field.attr('data-sn-editor')) {
            field.on('change', $.proxy(function() {
                this.setErrorStatus(this.validate());
            }, this));
        }
    }
}

/**
 * Esegue la validazione del valore contenuto nel campo (si veda il metodo {@link getValue}) in base alle regole impostate
 * tramite gli attributi del tag associato al campo.
 * E' possibile in alternativa passare come parametro il valore da usare per la validazione.
 * 
 * @param {string} value Valore da usare per la validazione (opzionale)
 * @returns {Boolean} True se il valore del campo ha superato la validazione
 */
Field.prototype.validate = function(value) {
    if (value === undefined)
        value = this.getValue();
    if (this.required && value.length <= 0) {
        return this.field.attr('data-missing-message');
    }
    if (this.regexp && value.length > 0 && !this.regexp.test(value)) {
        return this.field.attr('data-invalid-message');
    }
    if (this.date) {
        if (!this.validateDate(value, this.field.datepicker('getDate'), this.required))
            return this.field.attr('data-invalid-message');
    }
    if (this.time && value.length > 0 && !this.time.test(value)) {
        return this.field.attr('data-invalid-message');
    }
    if (this.number) {
        var number = this.number == 'int' ? parseInt(value, 10) : parseFloat(value);
        if (this.min && number < this.min)
            return this.minMessage || this.field.attr('data-invalid-message');
        if (this.max && number > this.max)
            return this.maxMessage || this.field.attr('data-invalid-message');
    }
    if (this.compare) {
        var compare;
        if (this.date) {
            value = this.field.datepicker('getDate');//valore del campo
            compare = this.form.getField(this.compare).field.datepicker('getDate');//valore del campo di confronto
        } else if (this.number) {
            compare = this.number == 'int' ? parseInt(this.form.getFieldValue(this.compare), 10) : parseFloat(this.form.getFieldValue(this.compare));//valore del campo di confronto
        } else {
            compare = this.form.getFieldValue(this.compare);
        }
        if (value) {
            switch (this.compareOperator) {
                case '=':
                case '==':
                    return value == compare ? true : this.compareMessage;
                case '!=':
                    return value != compare ? true : this.compareMessage;
                case '>':
                    return value > compare ? true : this.compareMessage;
                case '>=':
                    return value >= compare ? true : this.compareMessage;
                case '<':
                    return value < compare ? true : this.compareMessage;
                case '<=':
                    return value <= compare ? true : this.compareMessage;
            }
            return this.compareMessage;
        }
        return true;
    }
    return true;
}
/**
 * Se il messaggio passato come parametro è vuoto viene nascosto il messaggio di errore
 * e il campo (insieme alla sua etichetta) viene impostato come validato.
 * Se invece è presente un messaggio di errore questo viene assegnato all'apposito tag,
 * il blocco campo-etichetta (ovvero la {@link div}) viene marcato con la classe 'has-error'
 * e reso visibile. 
 * @param {string} message Messaggio di errore
 */
Field.prototype.setErrorStatus = function(message) {
    if (message !== undefined && message.length > 0) {
        this.div.addClass('has-error');
        this.errormessage.text(message);
        this.error.show();
    } else {
        this.div.removeClass('has-error');
        this.error.hide();
    }
}
/**
 * Restituisce il valore contenuto nel campo usando il metodo .val(), a meno che il campo non
 * è una checkbox. In questo caso viene verificata la presenza del pseudo-selettore :checked
 * e restituito 1 oppure 0.
 * @returns {mixed} Valore contenuto nel campo
 */
Field.prototype.getValue = function() {
    if (this.field.attr('type') == 'checkbox') {
        return this.field.is(':checked') ? 1 : 0;
    } else if (this.field.attr('data-sn-editor')) {
        return this.field.code() != '<p><br></p>' ? this.field.code() : '';
    } else {
        return this.field.val();
    }
}
/**
 * Imposta il valore contenuto nel campo usando indistintamente
 * il metodo .val().
 * @param {mixed} value Valore da assegnare al campo
 */
Field.prototype.setValue = function(value) {
    this.field.val(value);
}
/**
 * Verifica che il valore contenuto in un campo di tipo 'date' sia una data valida.
 * Il primo parametro è la stringa restituita dal metodo .val() del campo, mentre
 * il secondo è l'oggetto Date restituito dal metodo $.datepicker('getDate').
 * Anzitutto viene confrontata la stringa con la regex che rappresenta una data in formato
 * 'gg/mm/aaaa'; se il formato è valido viene costruito un oggetto Date a partire dalla stringa,
 * quindi viene confrontato con l'oggetto passato come secondo parametro. Se i due oggetti
 * rappresentano la stessa data la validazione ha successo.
 * @param {string} dateString Stringa che rappresenta la data contenuta nel campo
 * @param {Date} date Oggetto Date selezionato tramite datepicker.
 * @returns {Boolean} True se la data è corretta e valida, false altrimenti
 */
Field.prototype.validateDate = function(dateString, date, required) {
    if ((dateString == null || dateString === '') && (required == undefined || required === false))
        return true;
    if (!/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/g.test(dateString.toString()))
        return false;
    var day = dateString.substring(0, 2);
    var month = parseInt(dateString.substring(3, 5), 10) - 1;
    var year = dateString.substring(6, 10);
    var d = new Date(year, month, day);
    return d.getTime() === date.getTime();
}

/**
 * Realizza una chiamata AJAX al server.
 * 
 * @param string controller
 * @param string action
 * @param string messageDIvId
 * @param mixed blockUIMessage Stringa oppure oggetto con elementi 'title' e 'message'
 * @param array params
 */
var AjaxRequest = function(controller, action, messageDiv, blockUIMessage, params) {
    if (controller === undefined || action === undefined || params === undefined)
        throw 'AjaxRequest constructor -  undefined parameter: controller, action or params';
    var url = '/' + controller + '/' + action;
    /* blocco schermo */
    if (blockUIMessage !== undefined && blockUIMessage !== null) {
        if (blockUIMessage instanceof Object) {
            ModalDialog.show(blockUIMessage.title, blockUIMessage.message);
        } else {
            ModalDialog.show(blockUIMessage, 'Attendere prego...');
        }
    }
    /* messaggio */
    if (messageDiv !== undefined && messageDiv !== null) {
        if (typeof messageDiv === 'string')
            messageDiv = $('#' + messageDiv);
        messageDiv.removeClass('warning').removeClass('success').hide();
    }
    /* esecuzione */
    $.ajax({
        url: url,
        type: params.method || 'POST',
        dataType: 'json',
        data: params.params,
        success: $.proxy(function(json) {
            /* sblocco schermo */
            if (blockUIMessage !== undefined && blockUIMessage !== null)
                ModalDialog.hide();
            params.onSuccess(json, messageDiv);
        }, this),
        error: $.proxy(function(xhr, textStatus, errorThrown) {
            /* sblocco schermo */
            if (blockUIMessage !== undefined && blockUIMessage !== null)
                ModalDialog.hide();
            /* callback */
            if (params.onError) {
                params.onError(xhr, messageDiv);
            } else {
                if (messageDiv !== undefined && messageDiv !== null) {
                    Message.showAjaxError(messageDiv, xhr);
                }
            }
        }, this)
    })
}

/**
 * Questa classe statica permette di visualizzare i messaggi di errore a seguito di chiamate Ajax.
 */
var Message = {
    /**
     * Inizializza il messaggio e lo rende visibile.
     * 
     * @param {mixed} div Oggetto jQuery (da selettore) oppure stringa di id
     * @param {type} message Messaggio di successo/errore
     * @param {type} isError True per indicare errore
     * @param {type} ajaxError Messaggio di errore restituito dalla chiamata Ajax
     * @param {type} afterFinishCallback Funzinoe da eseguire dopo che il messaggio è comparso
     */
    show: function(div, message, isError, ajaxError, afterFinishCallback) {
        var msg = typeof div === 'string' ? $('#' + div) : div;
        msg.html(message + (ajaxError ? ' Error ' + ajaxError.status + ' ' + ajaxError.statusText : ''));
        msg.addClass(isError ? 'alert-danger' : 'alert-success');
        msg.removeClass(isError ? 'alert-success' : 'alert-danger');
        msg.fadeIn('slow', function() {
            if (afterFinishCallback)
                afterFinishCallback();
        });
    },
    /**
     * Mostra un messaggio di errore associato a una richiesta Ajax fallita (ovvero intercettata
     * dal metodo error() di $.ajax).
     * La proprietà responseText contiene il messaggio di errore solo se l'applicazione è
     * in modalità debug, e solo in quest'ultimo caso viene mostrato. 
     * @param {mixed} div Oggetto jQuery oppure id della <div> del messaggio di errore
     * @param {object} xhr Errore Ajax
     * @param {function} afterFinishCallback Funzione da eseguire dopo aver mostrato il messaggio di errore
     */
    showAjaxError: function(div, xhr, afterFinishCallback) {
        var msg = typeof div === 'string' ? $('#' + div) : div;
        msg.html('ERRORE AJAX. Error ' + xhr.status + ' ' + xhr.statusText + (xhr.responseText.length > 0 ? ' : <em>' + xhr.responseText + '</em>' : ''));
        msg.addClass('alert-danger');
        msg.removeClass('alert-success');
        msg.fadeIn('slow', function() {
            if (afterFinishCallback)
                afterFinishCallback();
        });
    },
    /**
     * Imposta il contenuto del messaggio di successo/errore (già stabilito dal server),
     * assegna le opportune classi di successo/errore e dopo aver fatto comparire il messaggio 
     * lancia le eventuali callback.
     * @param {mixed} div Oggetto jQuery oppure id della <div> del messaggio di errore
     * @param {object} json Risposta del server
     * @param {function} successCallback Callback in caso di successo
     * @param {function} errorCallback Callback in caso di errore
     */
    showOverJson: function(div, json, successCallback, errorCallback) {
        var msg = typeof div === 'string' ? $('#' + div) : div;
        msg.html(json.message);
        msg.addClass(json.error ? 'alert-danger' : 'alert-success');
        msg.removeClass(json.error ? 'alert-success' : 'alert-danger');
        msg.fadeIn('slow', function() {
            if (!json.error && successCallback) {
                successCallback();
            } else if (json.error && errorCallback) {
                errorCallback();
            }
        });
    }
}

/**
 * Gestisce il dialog modale, unico per tutte le pagine.
 * 
 * @type object
 */
var ModalDialog = {
    /** <div> esterna */
    div: null,
    /** Sezione del titolo */
    title: null,
    /** Sezione del contenuto */
    content: null,
    /**
     * 
     */
    init: function() {
        if (this.div === null) {
            this.div = $('#main-modal');
            this.title = $('#main-modal-title');
            this.content = $('#main-modal-content');
            this.div.modal({
                backdrop: 'static',
                keyboard: false
            });
        }
    },
    show: function(title, content) {
        this.init();
        this.title.html(title);
        this.content.html(content ? content : title + '. Attendere prego...');
        this.div.modal('show');
    },
    hide: function() {
        this.div.modal('hide');
    }
}

/**
 * Gestisce le funzionalità di un'area per drag and drop.
 * 
 * Parametri utilizzabili (ultimo argomento):
 * <ul>
 * <li>path: percorso della cartella nella quale verrà salvata l'immagine uploadata (es. '/pictures' per salvare in '/images/pictures)</li>
 * <li>dialogMessage: testo da mostrare nel corpo della dialog modale</li>
 * <li>beforeTransferStart: eventuale callback da eseguire immediatamente prima della chiamata Ajax</li>
 * <li>message: id oppure oggetto jQuery del messaggio di errore (da passare alle callback seguenti)
 * <li>onSuccess: callback da eseguire in caso di sucesso (dopo aver fatto scomparire la dialog modale e aver impostato
 *   il src dell'immagine</li>
 * <li>error: callback da eseguire in caso di errore (dopo aver fatto scomparire la dialog modale)</li>
 * </ul>
 * 
 * @param {mixed} div Oggetto jQuery dell'area (oppure id)
 * @param {string} controller Nome del controller
 * @param {string} action Nome dell'azione che gestirà il trasferimento del file
 * @param {object} params Parametri 
 */
var PictureDragAndDropHandler = function(div, controller, action, params) {
    // argomenti
    this.div = typeof div == 'string' ? $('#' + div) : div;
    this.controller = controller;
    this.action = action;
    this.params = params;
    // componenti
    this.span = $('#' + div.attr('id') + '_span');
    this.label = $('#' + div.attr('id') + '_label');
    this.img = $('#' + div.attr('id') + '_img');
    this.clear = $('#' + div.attr('id') + '_clear');
    this.clear.click($.proxy(function() {
        this.img.attr('src', null);
        this.img.hide();
        this.label.html(null);
        this.label.hide();
        this.span.show();
        this.clear.hide();
    }, this));
    $('#' + div.attr('id') + ' .btn-file :file').on('fileselect', $.proxy(function(event, file) {
        this.transfer(file);
    }, this));
    if (params.message)
        this.message = typeof params.message == 'string' ? $('#' + params.message) : params.message;
    this.initDnd();
}
/**
 * Imposta gli event handlers per le operazioni di drag e drop.
 * Il drag assegna (e poi toglie) la classe 'drop' alla div principale, mentre il 
 * drop recupera i dati relativi al file droppato e li passa al metodo transfer().
 */
PictureDragAndDropHandler.prototype.initDnd = function() {
    this.div.on('dragenter', $.proxy(function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.div.addClass('drop');
    }, this));
    this.div.on('dragleave', $.proxy(function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.div.removeClass('drop');
    }, this));
    this.div.on('dragover', $.proxy(function(e) {
        e.stopPropagation();
        e.preventDefault();
    }, this));
    this.div.on('drop', $.proxy(function(e) {
        this.div.removeClass('drop');
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files;
        if (files.length == 1)
            this.transfer(files[0]);
    }, this));
}
/**
 * Esegue il caricamento del file sul server via Ajax.
 * @param {object} file File droppato
 */
PictureDragAndDropHandler.prototype.transfer = function(file) {
    var fd = new FormData;
    fd.append('file', file);
    if (this.params.path)
        fd.append('path', this.params.path);
    ModalDialog.show('<div id="progressbar"></div>', this.params.dialogMessage ? this.params.dialogMessage : 'Caricamento file');
    if (this.params.beforeTransferStart)
        this.params.beforeTransferStart();
    var progressBar = $('#progressbar');
    progressBar.progressbar();
    $.ajax({
        xhr: function() {
            var xhrobj = $.ajaxSettings.xhr();
            if (xhrobj.upload) {
                xhrobj.upload.addEventListener('progress', function(event) {
                    var percent = 0;
                    var position = event.loaded || event.position;
                    var total = event.total;
                    if (event.lengthComputable)
                        percent = Math.ceil(position / total * 100);
                    progressBar.progressbar('value', percent);
                }, false);
            }
            return xhrobj;
        },
        url: '/' + this.controller + '/' + this.action,
        type: 'POST',
        contentType: false,
        processData: false,
        cache: false,
        data: fd,
        dataType: 'json',
        success: $.proxy(function(json) {
            if (this.img) {
                this.img.attr('src', json.data);
                this.img.show();
            }
            if (this.label) {
                this.label.text(json.data);
                this.label.show();
            }
            this.span.hide();
            this.clear.show();
            ModalDialog.hide();
            if (this.params.onSuccess)
                this.params.onSuccess(json, this.message);
        }, this),
        error: $.proxy(function(error) {
            ModalDialog.hide();
            if (this.params.error)
                this.params.error(error, this.message);
        }, this)
    });
}
/**
 * Restituisce il contenuto di src dell'immagine droppata.
 * @returns {string} Percorso completo dell'immagine.
 */
PictureDragAndDropHandler.prototype.getImgPath = function() {
    return this.img.attr('src');
}
/**
 * Restituisce il contenuto della label con il percorso del file droppato.
 * @returns {string} Percorso completo del file.
 */
PictureDragAndDropHandler.prototype.getFilePath = function() {
    return this.label.text();
}

/* Metodi per le stringhe */
String.prototype.toProperCase = function() {
    var smallWords = /^(zjfhjd?\.?|via)$/i;

    return this.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-']*/g, function(match, index, title) {
        if (index > 0 && index + match.length !== title.length &&
                match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
                (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                title.charAt(index - 1).search(/[^\s-]/) < 0) {
            return match.toLowerCase();
        }

        if (match.substr(1).search(/[A-Z]|\../) > -1) {
            return match;
        }

        return match.charAt(0).toUpperCase() + match.substr(1);
    });
};
String.prototype.textBeforeFirstUnderscore = function() {
    return this.substring(0, this.indexOf('_'));
}