Ext.tip.QuickTipManager.init();
var mainPanel;
var defaultDate=new Date();
var finishTime=[0,0,0];
var timeoutAjax=18000;
var task;
var traderAr=[];
var sprAr=[];

Ext.onReady(function(){
    Ext.Ajax.on('beforerequest',function(){ Ext.getBody().mask(vcbl[lang].name_mask); }, Ext.getBody());
    Ext.Ajax.on('requestcomplete',function(){ Ext.getBody().unmask(); } ,Ext.getBody());
    Ext.Ajax.on('requestexception',function(){ Ext.getBody().unmask(); }, Ext.getBody());
    auth();
});
function auth(){
    Ext.Ajax.request({
        url: 'index.php',
        method: 'POST',
        params: { codex: 'authSession' },
        success: function(response){
            var text=response.responseText*1;
            if(text===1){ viewPage(); }
            else { loginWin(); }
        },
        failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_transfer_failed); }
    });
}
function loginWin(){
    var enterBut=Ext.create('Ext.button.Button', {
        text: vcbl[lang].login_win_button,
        disabled: true,
        handler: function(){
            if(!win.validateField()) return false;
            Ext.Ajax.request({
                url: 'index.php',
                method: 'POST',
                params: { codex: 'auth', login: win.getComponent('login').getValue(), password: win.getComponent('password').getValue() },
                success: function(response){
                    var text=response.responseText*1;
                    if(text===1){ viewPage(); win.close(); }
                    else {
                        window.location="http://www.kortes.com/404.html";
                    }
                },
                failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_transfer_failed); }
            });
        }
    });
    var win=Ext.create('Ext.window.Window',{
        title: vcbl[lang].login_win_title,
        iconCls: 'logout',
        width: 300,
        id: 'loginwin',
        closable: false, resizable: false, draggable: false,
        modal: true, border: false, plain: true,
        defaultFocus: 'login',
        keyEnter: {},
        layout: { type: 'vbox', align: 'stretch' },
        defaults: { xtype: 'textfield', allowBlank: false, blankText: vcbl[lang].blank_text, listeners: {
            change: function(tF,nV,oV){ if(win.validateField()) enterBut.enable(); else enterBut.disable(); }
        } },
        items: [
            { id: 'login', fieldLabel: 'Login' },
            { id: 'password', fieldLabel: 'Password', inputType: 'password' }
        ],
        buttons: [enterBut],
        validateField: function(){
            if(!this.getComponent('login').isValid() || !this.getComponent('password').isValid()) return false;
            else return true;
        },
        listeners: {
            show: function(w){
                w.keyEnter=new Ext.util.KeyMap({
                    target: w.getId(),
                    key: 13,
                    fn: enterBut.handler
                });
            },
            close: function(w){w.keyEnter.destroy();}
        }
    });
    win.show();
}
function viewPage(){
    getSpr();
    var tree=treePanel();
    var trader=traderPanel();
    var grid=gridPanel();
    mainPanel=Ext.create('Ext.container.Viewport', {
        border: false,
        layout: { type: 'hbox',align: 'stretch' },
        treeP: tree,
        gridP: grid,
        traderP: trader,
        items: [Ext.create('Ext.Panel', {
            split: true,
            width: 400,
            layout: 'border',
            border: false,
            items: [tree,trader]
        }),grid],
        trader: trader,
        loadingDataForBasis: function(idBasis, id_terms){
            var store=grid.getStore();
            store.removeAll();
            store.getProxy().extraParams.idBasis=idBasis;
            store.getProxy().extraParams.id_terms=id_terms;
            store.load();
        },
        resetMP: function(){ tree.resetPanel(); grid.resetPanel(); },
        loadMP: function(){ tree.getStore().removeAll(); tree.getStore().load(); },
        reloadTrader: getTraderList
    });
    getTimeForMonitor();
    getTraderList();
}
function getSpr(){
    Ext.Ajax.request({
        url: 'index.php',
        method: 'POST',
        params: { codex: 'getSpr', lang: lang },
        success: function(response){
            sprAr = JSON.parse(response.responseText);
        },
        failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_transfer_failed); }
    });
}
function tablePanel(){
    
}
function treePanel(){
    return Ext.create('Ext.tree.Panel', {
        title: vcbl[lang].basis_title,
        region: 'center',
        width: 400,
        store: Ext.create('Ext.data.TreeStore', {
            proxy: {
                actionMethods: {read: 'POST'},
                extraParams: {codex: 'getTree', lang: lang},
                type: 'ajax',
                timeout: timeoutAjax,
                url: 'index.php',
                reader: { type: 'json' }
            }
        }),
        rootVisible: false,
        listeners: {
            itemclick: function(view,rec,item,index){
                if(!!rec.get('idBasis')) mainPanel.loadingDataForBasis(rec.get('idBasis'), rec.get('id_terms'));
            }
        },
        resetPanel: function(){ this.getStore().removeAll(); }
    });
}
function traderPanel(){
    return Ext.create('Ext.grid.Panel', {
        title: vcbl[lang].trader_title,
        split: true,
        height: 400,
        region: 'south',
        columnLines: true,
        tools: [{
            type:'plus',
            tooltip: vcbl[lang].new_trader_title,
            callback: () => { addTrader(); }
        },{
            type:'refresh',
            tooltip: vcbl[lang].refresh_title,
            callback: () => { mainPanel.reloadTrader(); }
        }],
        store: Ext.create('Ext.data.Store', {
            fields:[ 'id', 'name_rus', 'name_eng'],
            autoLoad: true,
            data: traderAr
        }),
        columns: [
            { text: 'ID', dataIndex: 'id', hidden: true },
            { text: 'Name RUS', dataIndex: 'name_rus', flex: 1, menuDisabled: true },
            { text: 'Name ENG', dataIndex: 'name_eng', flex: 1, menuDisabled: true }
        ],
        listeners: {
            'rowdblclick': function(grid, rec){
                //addTrader(rec.data.id, rec.data.name_rus, rec.data.name_eng);
            }
        }
    });
}
function getTraderList(){
    Ext.Ajax.request({
        url: 'index.php',
        method: 'POST',
        params: { codex: 'getTraderList', lang: lang },
        success: function(response){
            traderAr = JSON.parse(response.responseText);
            mainPanel.trader.getStore().removeAll();
            mainPanel.trader.getStore().setData(traderAr);
        },
        failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_transfer_failed); }
    });
}
function addTrader(id_trader, name_rus, name_eng){
    let win = Ext.create('Ext.window.Window', {
        title: vcbl[lang].add_trader_title,
        modal: true,
        layout: 'fit',
        items: [{
            xtype: 'form',
            frame: true,
            url: 'index.php',
            method: 'POST',
            baseParams: { 'codex': 'addTrader', 'id_trader': id_trader || 0 },
            defaults: { xtype: 'textfield', width: 400 },
            items: [
                { name: 'name_rus', fieldLabel: 'Name RUS', value: name_rus || '', id: 'name_rus', allowBlank: false },
                { name: 'name_eng', fieldLabel: 'Name ENG', value: name_eng || '', allowBlank: false }
            ],
            buttons: [{
                id: 'save_new_trader',
                text: vcbl[lang].save_button_title,
                disabled: true,
                formBind: true,
                handler: function(){
                    this.up('form').getForm().submit({
                        success: function(form, action) {
                            win.close();
                            mainPanel.reloadTrader();
                        },
                        failure: function(form, action) {
                            Ext.Msg.alert(vcbl[lang].title_alert_error, action.result ? action.result.message : 'No response');
                        }
                    });
                }
            }]
        }]
    }).show();
    Ext.getCmp('name_rus').focus();
}
function gridPanel(){
    var valMinNew=Ext.create('Ext.form.field.Number', { allowBlank: false, decimalPrecision: 3, minValue: 0, maxValue: 99999999 });
    var valMaxNew=Ext.create('Ext.form.field.Number', { allowBlank: false, decimalPrecision: 3, minValue: 0, maxValue: 99999999 });
    var grid=Ext.create('Ext.grid.Panel', {
        title: vcbl[lang].title_grid_values,
        titleBase: vcbl[lang].title_grid_values,
        split: true,
        flex: 1,
        plugins: {ptype: 'cellediting', clicksToEdit: 1,
            watchDelta: function(dMin,dMax){
                if(Math.abs(dMin-dMax)>=10){
                    Ext.Msg.alert(vcbl[lang].title_alert_warning, vcbl[lang].difference_between_changes);
                }
            },
            listeners: {
                beforeedit: function(e,c){
                    if(!(finishTime[0]<0 && finishTime[2]>0)) { c.cancel=true; return false; }
                    //if(c.record.data['rec_id']===0 && (c.field==="comm_rus" || c.field==="comm_eng")) {c.cancel=true;return false;}
                    if(c.field==="val_min_new"){
                        if(!!c.record.data['val_max_new']){
                            valMinNew.setMaxValue(c.record.data['val_max_new']);
                        } else valMinNew.setMaxValue(99999999);
                    } else if(c.field==="val_max_new"){
                        if(!!c.record.data['val_min_new']){
                            valMaxNew.setMinValue(c.record.data['val_min_new']);
                        } else valMaxNew.setMinValue(0);
                    }
                },
                edit: function(e,c){
                    var dMin=0,dMax=0;
                    if(!!c.record.data['val_min_new']){ dMin=Math.abs(c.record.data['val_min']-c.record.data['val_min_new'])/c.record.data['val_min']*100; }
                    if(!!c.record.data['val_max_new']){ dMax=Math.abs(c.record.data['val_max']-c.record.data['val_max_new'])/c.record.data['val_max']*100; }
                    if(c.field==="val_min_new" && !!c.record.data['val_min_new']){
                        if(dMin>=25){
                            Ext.Msg.alert(vcbl[lang].title_alert_warning, vcbl[lang].change_minimum_price, function(){ e.watchDelta(dMin,dMax); });
                        }
                    } else if(c.field==="val_max_new" && !!c.record.data['val_max_new']){
                        if(dMax>=25){
                            Ext.Msg.alert(vcbl[lang].title_alert_warning, vcbl[lang].change_maximum_price, function(){ e.watchDelta(dMin,dMax); });
                        }
                    }
                }
            }
        },
        store: Ext.create('Ext.data.Store', {
            fields:['inner_id','rec_id','status','id_basis','basis','id_prod','prod','id_country','country','id_terms','terms','id_currency','currency','date1','date2','val_min','val_max','date_new','val_min_new','val_max_new','comm_rus','comm_eng'],
            groupField: 'prod',
            autoLoad: false,
            proxy: {
                actionMethods: { read: 'POST' },
                extraParams: { codex: 'getGrid', idBasis: 0, id_terms: 0, act: true, lang: lang },
                type: 'ajax',
                timeout: timeoutAjax,
                url: 'index.php',
                reader: { type: 'json' }
            },
            listeners: {
                'update': function(store,rec,oper,modFName){
                    if(rec.get(modFName[0])!=="" || modFName[0]==="comm_rus" || modFName[0]==="comm_eng"){
                        if(rec.get('date_new')==="" && (modFName[0]==="val_min_new" || modFName[0]==="val_max_new")){
                            rec.set('date_new', defaultDate);
                        }
                        
                        if(modFName[0]==="val_min_new" && rec.get('val_max_new')==="") rec.set('val_max_new',rec.get(modFName[0])+1);
                        else if(modFName[0]==="val_max_new" && rec.get('val_min_new')==="") rec.set('val_min_new',rec.get(modFName[0])-1);
                        
                        if(modFName[0]==="val_min_new") valMaxNew.setMinValue(rec.get(modFName[0]));
                        else if(modFName[0]==="val_max_new") valMinNew.setMaxValue(rec.get(modFName[0]));
                        
                        var params={codex: 'setDataField',inner_id: rec.get('inner_id')};
                        params[modFName[0]]=modFName[0]==="date_new"?Ext.Date.format(rec.get(modFName[0]),'Y-m-d'):rec.get(modFName[0]);
                        Ext.Ajax.request({
                            url: 'index.php',
                            method: 'POST',
                            params: params,
                            success: function(response){ },
                            failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_transfer_failed); }
                        });
                    }
                }
            }
        }),
        features: [{ftype:'grouping',groupHeaderTpl:'{name}'}],
        columns: {
            defaults: {menuDisabled: true},
            items: [
                {text: '', dataIndex: 'status', width: 25},
                {text: vcbl[lang].title_column_country, dataIndex: 'country', width: 100},
                {text: vcbl[lang].title_column_basis, dataIndex: 'basis', width: 200},
                {text: vcbl[lang].title_column_condition, dataIndex: 'terms', width: 75},
                {text: vcbl[lang].title_column_trader, dataIndex: 'name_trader', width: 200},
                {text: vcbl[lang].title_column_currency, dataIndex: 'currency', width: 75},
                {text: vcbl[lang].title_column_date, dataIndex: 'date1', xtype: 'datecolumn', width: 100},
                {text: 'MIN', dataIndex: 'val_min', width: 50 },
                {text: 'MAX', dataIndex: 'val_max', width: 50 },
                {text: vcbl[lang].title_column_date_new, dataIndex: 'date_new', xtype: 'datecolumn', width: 100},
                {text: 'MIN new', dataIndex: 'val_min_new', width: 70, editor: valMinNew},
                {text: 'MAX new', dataIndex: 'val_max_new', width: 70, editor: valMaxNew},
                {
                    xtype: 'actioncolumn',
                    width: 25,
                    items: [{
                        icon   : 'images/clear.png',
                        tooltip: vcbl[lang].title_del_new_data,
                        handler: function(g,rI,cI) {
                            if(!(finishTime[0]<0 && finishTime[2]>0)) {return false;}
                            var rec=g.getStore().getAt(rI);
                            rec.set({date_new:"",val_min_new:"",val_max_new:""});
                            var params={codex: 'setDataField',inner_id: rec.get('inner_id'),date_new:"",val_min_new:"",val_max_new:""};
                            Ext.Ajax.request({
                                url: 'index.php',
                                method: 'POST',
                                params: params,
                                success: function(response){ },
                                failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_deletion_failed); }
                            });
                        }
                    }]
                },
                {text: vcbl[lang].title_column_comment_rus, dataIndex: 'comm_rus', cellWrap: true, flex: 1, editor: { xtype: 'textfield' } },
                {text: vcbl[lang].title_column_comment_eng, dataIndex: 'comm_eng', cellWrap: true, flex: 1, editor: { xtype: 'textfield' } }
            ]
        },
        tbar: [{
            text: vcbl[lang].add_value,
            border: 1,
            style: { borderColor: 'red', borderStyle: 'solid' },
            handler: addValue
        },'-',new Ext.form.Checkbox({
            boxLabel: vcbl[lang].only_actual_records,
            checked: true,
            listeners: {
                'change': function(cb,nV,oV){
                    var extraParams=grid.getStore().getProxy().extraParams;
                    extraParams.act=nV;
                    if(extraParams.idBasis>0) grid.getStore().load();
                }
            }
        }),'->',Ext.create('Ext.form.ComboBox', {
            store: Ext.create('Ext.data.Store', {
                fields: ['id', 'name'],
                data : [ {"id":"rus", "name":"Русский"}, {"id":"eng", "name":"English"} ]
            }),
            queryMode: 'local',
            editable: false,
            displayField: 'name',
            valueField: 'id',
            value: lang,
            listeners: {
                change: (c, nV) => { location.href = window.location.href.split("?")[0].replace('#', '') + '?lang=' + nV; }
            }
        })],
        tools:[{
            type:'refresh',
            tooltip: vcbl[lang].refresh_title,
            callback: function(g,t) { g.getStore().removeAll(); g.getStore().load(); }
        }],
        resetPanel: function(){
            this.getStore().getProxy().extraParams.idBasis=0;
            this.getStore().removeAll();
        },
        changeTitle: function(addText){ this.setTitle(this.titleBase+" "+addText); }
    });
    return grid;
}
function addValue(){
    let win = Ext.create('Ext.window.Window', {
        title: vcbl[lang].add_value,
        modal: true,
        layout: 'fit',
        items: [{
            xtype: 'form',
            frame: true,
            url: 'index.php',
            method: 'POST',
            baseParams: { 'codex': 'addValue', lang: lang },
            defaults: { xtype: 'textfield', width: 400, allowBlank: false, labelWidth: 115 },
            items: [Ext.create('Ext.form.ComboBox', {
                name: 'id_basis',
                fieldLabel: vcbl[lang].select_basis,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'name'],
                    data : sprAr.basis
                }),
                queryMode: 'local',
                displayField: 'name',
                editable: false,
                valueField: 'id'
            }),Ext.create('Ext.form.ComboBox', {
                name: 'id_product',
                fieldLabel: vcbl[lang].select_product,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'name'],
                    data : sprAr.product
                }),
                queryMode: 'local',
                displayField: 'name',
                editable: false,
                valueField: 'id'
            }),Ext.create('Ext.form.ComboBox', {
                name: 'id_terms',
                fieldLabel: vcbl[lang].select_terms,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'name'],
                    data : sprAr.terms
                }),
                queryMode: 'local',
                displayField: 'name',
                editable: false,
                valueField: 'id'
            }),Ext.create('Ext.form.ComboBox', {
                name: 'id_currency',
                fieldLabel: vcbl[lang].select_currency,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'name'],
                    data : sprAr.currency
                }),
                queryMode: 'local',
                displayField: 'name',
                editable: false,
                valueField: 'id'
            }),Ext.create('Ext.form.ComboBox', {
                name: 'id_trader',
                fieldLabel: vcbl[lang].select_trader,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', lang === 'rus' ? 'name_rus' : 'name_eng'],
                    data : traderAr
                }),
                queryMode: 'local',
                displayField: lang === 'rus' ? 'name_rus' : 'name_eng',
                editable: false,
                valueField: 'id'
            })],
            buttons: [{
                id: 'save_new_value',
                text: vcbl[lang].save_button_title,
                disabled: true,
                formBind: true,
                handler: function(){
                    this.up('form').getForm().submit({
                        success: function(form, action) {
                            mainPanel.gridP.getStore().removeAll();
                            mainPanel.gridP.getStore().load();
                            win.close();
                        },
                        failure: function(form, action) {
                            Ext.Msg.alert(vcbl[lang].title_alert_error, action.result ? action.result.message : 'No response');
                        }
                    });
                }
            }]
        }]
    }).show();
}
function getTimeForMonitor(){
    Ext.Ajax.request({
        url: 'index.php',
        method: 'POST',
        params: { codex: 'timeMonitor' },
        success: function(response){
            var ans=response.responseText.split(",");
            finishTime=[ans[0]*1,ans[1]*1,ans[2]*1];
            task={ run: function(){ timerWork(); }, interval: 1000 };
            Ext.TaskManager.start(task);
            timerWork();
        },
        failure: function(response){ Ext.Msg.alert(vcbl[lang].title_alert_error, vcbl[lang].data_transfer_failed); }
    });
}
function timerWork(){
    if(finishTime[2]===0){ window.location.reload(false); }
    
    if(finishTime[0]>0 && finishTime[1]>0){
        Ext.TaskManager.stop(task);
        getTimeForMonitor();
        return false;
    }
    var text="";
    if(finishTime[0]<0 && finishTime[2]>0){
        text='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[<span class="enable_edit">'+vcbl[lang].until_end_data_entry+': '+parseTimeForTitle(finishTime[0])+'</span>]';
    } else if(finishTime[2]<0){
        text='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[<span class="disable_edit">'+vcbl[lang].until_start_data_entry+': '+parseTimeForTitle(finishTime[2])+'</span>]';
    } else if(finishTime[1]<0){
        text='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[<span class="disable_edit">'+vcbl[lang].until_start_data_entry+': '+parseTimeForTitle(finishTime[1])+'</span>]'; 
    }
    finishTime=[finishTime[0]+1,finishTime[1]+1,finishTime[2]+1];
    mainPanel.gridP.changeTitle(text);
}
function parseTimeForTitle(val){
    if(val<0)val=val*-1;
    var hour=(val/3600).toString().split(/\./)[0];
    var min=((val-hour*3600)/60).toString().split(/\./)[0];
    var sec=val-hour*3600-min*60;
    if(min<10)min="0"+min;
    if(sec<10)sec="0"+sec;
    return '<span class="digit">'+hour+':'+min+':'+sec+'</span>';
}