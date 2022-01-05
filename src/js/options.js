( function ( w, d ) {

'use strict';

w.chrome = ( ( typeof browser != 'undefined' ) && browser.runtime ) ? browser : chrome;


var is_edge = ( function () {
        var flag = ( 0 <= w.navigator.userAgent.toLowerCase().indexOf( 'edge' ) );
        
        return function () {
            return flag;
        };
    } )(), // end of is_edge()
    
    is_firefox = ( function () {
        var flag = ( 0 <= w.navigator.userAgent.toLowerCase().indexOf( 'firefox' ) );
        
        return function () {
            return flag;
        };
    } )(), // end of is_firefox()
    
    is_vivaldi = ( function () {
        var flag = ( 0 <= w.navigator.userAgent.toLowerCase().indexOf( 'vivaldi' ) );
    
        return function () {
            return flag;
        };
    } )(), // end of is_vivaldi()
    
    value_updated = false,
    background_window = chrome.extension.getBackgroundPage();


$( w ).on( ( is_vivaldi() ) ? 'blur' : 'unload', function ( event ) {
    // ※ Vivaldi 2.5.1525.48 では、popup を閉じても unload イベントは発生せず、次に popup を開いたときに発生してしまう
    //    → 暫定的に blur イベントで対処
    
    background_window.log_debug( '< unloaded > value_updated:', value_updated );
    
    if ( ! value_updated ) {
        return;
    }
    
    value_updated = false;
    
    /*
    //chrome.runtime.sendMessage( {
    //    type : 'RELOAD_TABS'
    //}, function ( response ) {
    //    background_window.log_debug( response, '< RELOAD_TABS event done >' );
    //} );
    // ※ popup → background では sendMessage() がうまく動作しない
    */
    
    background_window.reload_tabs();
    // オプションを変更した場合にタブをリロード
    // ※TODO: 一度でも変更すると、値が同じであってもリロードされる
    
    background_window.log_debug( '< reload_tabs() done >' );
} );


$( function () {
    var RADIO_KV_LIST = [
            { key : 'ENABLED_ON_TWEETDECK', val : true }
        ,   { key : 'DISPLAY_ALL_IN_ONE_PAGE', val : true }
        ,   { key : 'DISPLAY_OVERLAY', val : true }
        ,   { key : 'OVERRIDE_CLICK_EVENT', val : true }
        ,   { key : 'DISPLAY_ORIGINAL_BUTTONS', val : true }
        ,   { key : 'OVERRIDE_GALLERY_FOR_TWEETDECK', val : true }
        ,   { key : 'DOWNLOAD_HELPER_SCRIPT_IS_VALID', val : true }
        ,   { key : 'SWAP_IMAGE_URL', val : false }
        ,   { key : 'HIDE_DOWNLOAD_BUTTON_AUTOMATICALLY', val : true }
        ,   { key : 'SUPPRESS_FILENAME_SUFFIX', val : false }
        ,   { key : 'SAME_FILENAME_AS_IN_ZIP', val : true }
        ,   { key : 'TAB_SORTING', val : true }
        ],
        INT_KV_LIST = [
            //{ key : 'WAIT_AFTER_OPENPAGE', val : 500, min : 0, max : null }
        ],
        STR_KV_LIST = [
            { key : 'BUTTON_TEXT' }
        ];
    
    STR_KV_LIST.forEach( function( str_kv ) {
        str_kv.val = chrome.i18n.getMessage( str_kv.key );
    } );
    
    $( '.i18n' ).each( function () {
        var jq_elm = $( this ),
            value = ( jq_elm.val() ) || ( jq_elm.html() ),
            text = chrome.i18n.getMessage( value );
        
        if ( ! text ) {
            return;
        }
        if ( ( value == 'OPTIONS' ) && ( jq_elm.parent().prop( 'tagName' ) == 'H1' ) ) {
            text += ' ( version ' + chrome.runtime.getManifest().version + ' )';
        }
        if ( jq_elm.val() ) {
            jq_elm.val( text );
        }
        else {
            jq_elm.html( text );
        }
    } );
    
    $( 'form' ).submit( function () {
        return false;
    } );
    
    
    function get_bool( value ) {
        if ( value === undefined ) {
            return null;
        }
        if ( ( value === '0' ) || ( value === 0 ) || ( value === false ) || ( value === 'false' ) ) {
            return false;
        }
        if ( ( value === '1' ) || ( value === 1 ) || ( value === true ) || ( value === 'true' ) ) {
            return true;
        }
        return null;
    }  // end of get_bool()
    
    
    function reset_context_menu( callback ) {
        chrome.runtime.sendMessage( {
            type : 'RESET_CONTEXT_MENU'
        }, function ( response ) {
            if ( typeof callback == 'function' ) {
                callback( response );
            }
        } );
    } // end of reset_context_menu()
    
    
    function set_radio_evt( kv ) {
        function check_svalue( kv, svalue ) {
            var bool_value = get_bool( svalue );
            
            if ( bool_value === null ) {
                return check_svalue( kv, kv.val );
            }
            return ( bool_value ) ? '1' : '0';
        }
        
        var key = kv.key,
            svalue = check_svalue( kv, localStorage[ key ] ),
            jq_target = $( '#' + key ),
            jq_inputs = jq_target.find( 'input:radio[name="' + key + '"]' );
        
        jq_inputs.unbind( 'change' ).each( function () {
            var jq_input = $( this ),
                val = jq_input.val();
            
            if ( val === svalue ) {
                //jq_input.attr( 'checked', 'checked' );
                jq_input.prop( 'checked', 'checked' );
            }
            else {
                //jq_input.attr( 'checked', false );
                jq_input.prop( 'checked', false );
            }
            // ※ .attr() で変更した場合、ラジオボタンが書き換わらない場合がある(手動変更後に[デフォルトに戻す]を行った場合等)ので、.prop() を使用すること。
            //   参考：[jQueryでチェックボックスの全チェック／外しをしようとしてハマッたこと、attr()とprop()の違いは罠レベル | Ultraひみちゅぶろぐ](http://ultrah.zura.org/?p=4450)
        } ).change( function () {
            var jq_input = $( this );
            
            localStorage[ key ] = check_svalue( kv, jq_input.val() );
            value_updated = true;
            
            if ( key == 'DOWNLOAD_HELPER_SCRIPT_IS_VALID' ) {
                reset_context_menu();
            }
        } );
    } // end of set_radio_evt()
    
    
    function set_int_evt( kv ) {
        function check_svalue( kv, svalue ) {
            if ( isNaN( svalue ) ) {
                svalue = kv.val;
            }
            else {
                svalue = parseInt( svalue );
                if ( ( ( kv.min !== null ) && ( svalue < kv.min ) ) || ( ( kv.max !== null ) && ( kv.max < svalue ) ) ) {
                    svalue = kv.val;
                }
            }
            svalue = String( svalue );
            return svalue;
        }
        
        var key = kv.key,
            svalue = check_svalue( kv, localStorage[ key ] ),
            jq_target = $( '#' + key ),
            jq_input = jq_target.find( 'input:text:first' ),
            jq_current = jq_target.find( 'span.current:first' );
        
        jq_current.text( svalue );
        jq_input.val( svalue );
        
        jq_target.find( 'input:button' ).unbind( 'click' ).click( function () {
            var svalue = check_svalue( kv, jq_input.val() );
            
            localStorage[ key ] = svalue;
            value_updated = true;
            
            jq_current.text( svalue );
            jq_input.val( svalue );
        } );
    } // end of set_int_evt()
    
    
    function set_str_evt( kv ) {
        function check_svalue( kv, svalue ) {
            if ( ! svalue ) {
                svalue = kv.val;
            }
            else {
                svalue = String( svalue ).replace( /(?:^\s+|\s+$)/g, '' );
                if ( ! svalue ) {
                    svalue = kv.val;
                }
            }
            return svalue;
        }
        
        var key = kv.key,
            svalue = check_svalue( kv, localStorage[ key ] ),
            jq_target = $( '#' + key ),
            jq_input = jq_target.find( 'input:text:first' ),
            jq_current = jq_target.find( 'span.current:first' );
        
        jq_current.text( svalue );
        jq_input.val( svalue );
        
        jq_target.find( 'input:button' ).unbind( 'click' ).click( function () {
            var svalue = check_svalue( kv, jq_input.val() );
            
            localStorage[ key ] = svalue;
            value_updated = true;
            
            jq_current.text( svalue );
            jq_input.val( svalue );
        } );
    } // end of set_str_evt()
    
    
    function set_operation_evt() {
        var jq_operation = $( 'input[name="OPERATION"]' ),
            operation = get_bool( localStorage[ 'OPERATION' ] );
        
        operation = ( operation === null ) ? true : operation; // デフォルトは true (動作中)
        
        function set_operation( next_operation ) {
            var button_text = ( next_operation ) ? ( chrome.i18n.getMessage( 'STOP' ) ) : ( chrome.i18n.getMessage( 'START' ) ),
                path_to_img = ( is_edge() ) ? 'img' : '../img', // TODO: MS-Edge の場合、options.html からの相対パスになっていない（manifest.jsonからの相対パス？）
                icon_path = ( next_operation ) ? ( path_to_img + '/icon_48.png' ) : ( path_to_img + '/icon_48-gray.png' );
            
            jq_operation.val( button_text );
            chrome.browserAction.setIcon( { path : icon_path } );
            
            localStorage[ 'OPERATION' ] = next_operation;
            operation = next_operation;
        }
        
        jq_operation.unbind( 'click' ).click( function( event ) {
            set_operation( ! operation );
            value_updated = true;
            
            reset_context_menu();
        } );
        
        set_operation( operation );
    } // end of set_operation_evt()
    
    
    function set_all_evt() {
        if ( is_firefox() ) {
            // TODO: Firefox 68.0.1 では、別タブ(about:blank)のdocumentにアクセスできないため、オーバーレイは常に有効とする
            localStorage[ 'DISPLAY_OVERLAY' ] = true;
        }
        RADIO_KV_LIST.forEach( function( radio_kv ) {
            set_radio_evt( radio_kv );
        } );
        if ( is_firefox() ) {
            // TODO: Firefox 68.0.1 では、別タブ(about:blank)のdocumentにアクセスできないため、変更不可とする
            $( '#DISPLAY_OVERLAY' ).css( { 'color' : 'gray' } );
            $( 'input[name="DISPLAY_OVERLAY"]' ).prop("disabled", true);
        }
        
        INT_KV_LIST.forEach( function( int_kv ) {
            set_int_evt( int_kv );
        } );
        
        STR_KV_LIST.forEach( function( str_kv ) {
            set_str_evt( str_kv );
        } );
        
        set_operation_evt();
        
        reset_context_menu();
    }   //  end of set_all_evt()
    
    
    set_all_evt();
    
    
    $( 'input[name="DEFAULT"]' ).click( function () {
        localStorage.clear();
        value_updated = true;
        
        set_all_evt();
        //location.reload();
    } );

} );

} )( window, document );

// ■ end of file
