( function ( w, d ) {

'use strict';

w.chrome = ( ( typeof browser != 'undefined' ) && browser.runtime ) ? browser : chrome;

if ( chrome.runtime.lastError ) {
    console.log( '* chrome.runtime.lastError.message:', chrome.runtime.lastError.message );
}

var SCRIPT_NAME = 'twOpenOriginalImage';


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


function get_int( value ) {
    if ( isNaN( value ) ) {
        return null;
    }
    return parseInt( value, 10 );
} // end of get_int()


function get_text( value ) {
    if ( value === undefined ) {
        return null;
    }
    return String( value );
} // end of get_text()


function get_init_function( message_type, option_name_to_function_map, namespace ) {
    var option_names = [];
    
    Object.keys( option_name_to_function_map ).forEach( function ( option_name ) {
        option_names.push( option_name );
    } );
    
    function analyze_response( response ) {
        var options = {};
        
        if ( ! response ) {
            response = {};
        }
        
        Object.keys( option_name_to_function_map ).forEach( function ( option_name ) {
            if ( ! ( option_name in response ) ) {
                options[ option_name ] = null;
                return;
            }
            options[ option_name ] =  option_name_to_function_map[ option_name ]( response[ option_name ] );
        } );
        return options;
    }
    
    function init( callback ) {
        // https://developer.chrome.com/extensions/runtime#method-sendMessage

        chrome.runtime.sendMessage( {
            type : message_type
        ,   names : option_names
        ,   namespace :  ( namespace ) ? namespace : ''
        }, function ( response ) {
            var options = analyze_response( response );
            callback( options );
        } );
    }
    
    return init;
} // end of get_init_function()


var twOpenOriginalImage_chrome_init = ( function() {
    var option_name_to_function_map = {
            SHOW_IN_DETAIL_PAGE : get_bool
        ,   SHOW_IN_TIMELINE : get_bool
        ,   ENABLED_ON_TWEETDECK : get_bool
        ,   DISPLAY_ALL_IN_ONE_PAGE : get_bool
        ,   DISPLAY_OVERLAY : get_bool
        ,   OVERRIDE_CLICK_EVENT : get_bool
        ,   DISPLAY_ORIGINAL_BUTTONS : get_bool
        ,   OVERRIDE_GALLERY_FOR_TWEETDECK : get_bool
        ,   DOWNLOAD_HELPER_SCRIPT_IS_VALID : get_bool
        ,   SWAP_IMAGE_URL : get_bool
        ,   HIDE_DOWNLOAD_BUTTON_AUTOMATICALLY : get_bool
        ,   SUPPRESS_FILENAME_SUFFIX : get_bool
        ,   TAB_SORTING : get_bool
        ,   SAME_FILENAME_AS_IN_ZIP : get_bool
        ,   OPERATION : get_bool
        ,   WAIT_AFTER_OPENPAGE : get_int
        ,   TITLE_PREFIX : get_text
        ,   TWEET_LINK_TEXT : get_text
        ,   BUTTON_TEXT : get_text
        ,   BUTTON_HELP_DISPLAY_ALL_IN_ONE_PAGE : get_text
        ,   BUTTON_HELP_DISPLAY_ONE_PER_PAGE : get_text
        ,   DOWNLOAD_HELPER_BUTTON_TEXT : get_text
        };
    
    return get_init_function( 'GET_OPTIONS', option_name_to_function_map );
} )(); // end of twOpenOriginalImage_chrome_init()


var extension_functions = ( () => {
    var tab_sorting_is_valid = ( ( default_value ) => {
            chrome.runtime.sendMessage( {
                type : 'GET_OPTIONS',
                names : [
                    'TAB_SORTING',
                ],
            }, ( response ) => {
                // ※オプションは非同期取得となるが、ユーザーがアクションを起こすまでに余裕があるので気にしない
                var tab_sorting_option_value = get_bool( response[ 'TAB_SORTING' ] );
                
                if ( tab_sorting_option_value !== null ) {
                    tab_sorting_is_valid = tab_sorting_option_value;
                }
            } );
            return default_value;
        } )( true ),
        
        reg_sort_index = new RegExp( '^request=tab_sorting&script_name=' + SCRIPT_NAME + '&request_id=(\\d+)&total=(\\d+)&sort_index=(\\d+)' ),
        
        open_multi_tabs = ( urls ) => {
            var request_id = '' + new Date().getTime(),
                window_name_prefix = 'request=tab_sorting&script_name=' + SCRIPT_NAME + '&request_id=' + request_id + '&total=' + urls.length + '&sort_index=';
            
            urls.reverse().forEach( ( url, index ) => {
                var sort_index = urls.length - index,
                    window_name = ( tab_sorting_is_valid ) ? ( window_name_prefix + sort_index ) : '_blank';
                
                w.open( url, window_name );
            } );
        }, // end of open_multi_tabs()
        
        request_tab_sorting = () => {
            var reg_result = ( w.name || '' ).match( reg_sort_index );
            
            if ( ! reg_result ) {
                return;
            }
            
            var request_id = reg_result[ 1 ],
                total = reg_result[ 2 ],
                sort_index = reg_result[ 3 ];
            
            chrome.runtime.sendMessage( {
                type : 'TAB_SORT_REQUEST',
                request_id : request_id,
                total : total,
                sort_index : sort_index,
            }, ( response ) => {
                //console.log( 'request_tab_sorting() response:', response );
            } );
            
            try {
                w.name = '';
            }
            catch ( error ) {
            }
        }; // end of request_tab_sorting()
    
    return {
        open_multi_tabs : open_multi_tabs,
        request_tab_sorting : request_tab_sorting,
    };
} )(); // end of extension_functions


chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
    switch ( message.type )  {
        case 'DOWNLOAD_IMAGE_REQUEST' :
            if ( ( ! message.img_url_orig ) || ( ! message.filename ) ) {
                sendResponse( {
                    result : 'NG',
                    message : 'parameter error'
                } );
                return false;
            }
            
            fetch( message.img_url_orig )
            .then( ( response ) => response.blob() )
            .then( ( blob ) => {
                try {
                    if ( typeof saveAs == 'function' ) {
                        //window.saveAs( blob, message.filename ); // Firefoxでは saveAs は window 下に存在しない
                        saveAs( blob, message.filename );
                    }
                    else {
                        var link = d.createElement('a');
                        
                        link.href = URL.createObjectURL( blob );
                        link.download = message.filename;
                        d.documentElement.appendChild( link );
                        link.click(); // TweetDeck だと、ダウンロードできない（ダウンロードが無効化されるイベントが設定されてしまう）=> saveAs() が有効ならばそちらを使用
                        d.documentElement.removeChild( link );
                    }
                    sendResponse( {
                        result : 'OK'
                    } );
                }
                catch( error ) {
                    console.error( 'save image error:', error, message.img_url_orig, blob );
                    sendResponse( {
                        result : 'NG',
                        message : 'save image error'
                    } );
                }
            } )
            .catch( ( error ) => {
                console.error( 'fetch() error:', error, message.img_url_orig );
                sendResponse( {
                    result : 'NG',
                    message : 'fetch() error'
                } );
            } );
            break;
        
        case 'RELOAD_REQUEST' :
            sendResponse( {
                result : 'OK'
            } );
            
            setTimeout( () => {
                location.reload();
            }, 100 );
            break;
        
        default :
            sendResponse( {
                result : 'NG',
                message : 'unknown type'
            } );
            return false;
    }
    return true;
} );

// content_scripts の情報を渡す
chrome.runtime.sendMessage( {
    type : 'NOTIFICATION_ONLOAD',
    info : {
        url : location.href,
    }
}, function ( response ) {
    /*
    //window.addEventListener( 'beforeunload', function ( event ) {
    //    // TODO: メッセージが送信できないケース有り ("Uncaught TypeError: Cannot read property 'sendMessage' of undefined")
    //    chrome.runtime.sendMessage( {
    //        type : 'NOTIFICATION_ONUNLOAD',
    //        info : {
    //            url : location.href,
    //            event : 'onbeforeunload',
    //        }
    //    }, function ( response ) {
    //    } );
    //} );
    */
} );

if ( /^https?:\/\/pbs\.twimg\.com\/media\//.test( location.href ) ) {
    // 複数画像を一度に開いたときにタブを並び替え
    extension_functions.request_tab_sorting();
}

w.twOpenOriginalImage_chrome_init = twOpenOriginalImage_chrome_init;
w.extension_functions = extension_functions;

} )( window, document );

// ■ end of file
