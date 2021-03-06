/**
Base Class for all Views in OXI namespace
*/
"use strict";

OXI.View = Ember.View.extend({
    jsClassName:'OXI.View: you must define jsClassName in your subclass!',
    _domReady:false,
    
    
    _toString:function(){
        return this.jsClassName + ' '+ this.toString();
    },

    setError:function(msg){
        this.errors.push(msg);
        this.set('_hasError',true);
    },

    getErrorsAsString:function(){
        return this.errors.join(' - ');
    }.property('_hasError'),

    hasError:function(){
        this.debug('has error?' + this._hasError );
        return (this.errors.length>null);
    }.property('_hasError'),

    resetErrors:function(){
        this.set('errors',[]);
        this.set('_hasError',false);
    },

    init:function(){
        //js_debug(this.jsClassName+':init' + this.toString());
        this.resetErrors();

        this._super();
    },


    destroy:function(){
        //js_debug(this.jsClassName+':destroy' + this.toString());
        this._super();
    },
    
    show:function(){
        this.set('isVisible', true);
    },
    hide:function(){
        this.set('isVisible', false);
    },
    toggle:function(bShow){
         this.set('isVisible', bShow);  
    },
    debug:function(data){
        js_debug({jsClassName:this._toString(),data:data},3);
    },
    didInsertElement: function(){
        //this.debug('DOM is ready!'+this.get('elementId')); 
        this.set('_domReady',true);
        
    },
    
     _lastItem: '' //avoid trailing commas
});

OXI.ContentBaseView = OXI.View.extend(
{
    //content prop: must be set via create() , info comes fropm server
    content:null,
    label:null,
    description:null,
    ButtonList:[],
    SectionView:null,//set via Constructor, points to parent
    
    getMainViewContainer:function(){
        return this.SectionView.SectionContainer;  
        
    },
    
    getButtonCount:function(){
        return this.ButtonList.length;
    },

    init:function(){
        //this.debug('init!');
        this.ButtonList = [];
        this.label=null;
        this.description=null;
        this._super();
        if(!this.content ){
            App.applicationError('ContentBaseView, init failed: no content definition!');
            return;
        }
        if (this.content.label){
            this.label = this.content.label;
        }
        if (this.content.description){
            this.description = this.content.description;
        }
        this._initButtons();
    },

    
    
    _initButtons:function(){
        //this.debug('init buttons!');
        if(!this.content.buttons)return;
        var i;
        for(i=0;i<this.content.buttons.length;i++){
            var def = this.content.buttons[i];
            def.ParentView = this;
            this.addButton(def);
        }
        
    },
    
    addButton: function(button_def){
        this.addButtonView(this._getButton(button_def));
    },
    
    addButtonView: function(ButtonView){
        this.ButtonList.push(this.createChildView(ButtonView));
    },
    _getButton: function(button_def){
        return OXI.PageButton.create(button_def);   
    },
    
    
     _lastItem: '' //avoid trailing commas
});

OXI.PageButton = OXI.View.extend({

    jsClassName:'OXI.PageButton',
    templateName: "page-button",
    tagName: 'button',
    classNames: ['btn'],
    label:null,//set via constructor 
    target:null,//set via constructor 
    action:null,//set via constructor 
    ParentView:null,//set via constructor 
    page:null,//set via constructor 
    css_class:null,//set via constructor 

    click: function(evt) {
        js_debug("Button "+this.label+" was clicked");
        var action = {
            action:this.action,
            page:this.page,
            label:this.label,
            target:this.target,
            source:this.ParentView
        };
        App.handleAction(action);
    },

    init:function(){
        this._super();
        if(!this.ParentView){
              App.applicationAlert('Button without ParentView!');
            return;  
        }
        
        if(!this.label){
            App.applicationAlert('Button without label!');
            return;
        }
        if(!this.action && !this.page){
            App.applicationAlert('Button without action and page!');
            return;
        }
        if(this.css_class){//set via constructor 
            var tmp = this.css_class.split(/\s+/);
            var i;
            for(i=0;i<tmp.length;i++){
                this.classNames.push(tmp[i]);   
            }   
        }else{
            this.classNames.push('btn-default');
        }
        
        
    },
    
     _lastItem: '' //avoid trailing commas
});



OXI.ModalView = OXI.View.extend({

    jsClassName:'OXI.ModalView',
    templateName: "modal-main",
    classNames: ['modal', 'fade'],//this is for the outer div around the dialog
    label:null,
    
    _is_opened: false,
    
    show: function(label){
        this.set('label',label);
        //js_debug('show modal');
        try{
            this.$().modal('show');
            this.set('_is_opened',true);
        }catch(e){
            js_debug('exception while closing modal...' + e);
        }
    },
    
    close: function(){
        this.set('label','');
        $('.modal-backdrop.fade.in').hide();
        
        //js_debug('hide modal');
        try{
            if(this._is_opened){
                this.$().modal('hide');
            }
        }catch(e){
            js_debug('exception while closing modal...' + e);
            
        }
        
    },
    
    init:function(){
        this._super();
        this.set('_is_opened',false);
        //this.set('controller',OXI.ModalControler.create({view:this}));
        this.set('ContentView', this.createChildView(
                                    OXI.SectionViewContainer.create({displayType:'modal'})
                                   ));
        
    },
    
     _lastItem: '' //avoid trailing commas
});

