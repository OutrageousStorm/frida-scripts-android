setTimeout(function(){Java.perform(function(){
var C=Java.use("android.content.ClipboardManager");
C.setText.implementation=function(t){console.log("[CLIPBOARD WRITE]: "+t);return this.setText.call(this,t)};
C.getText.implementation=function(){var r=this.getText.call(this);if(r)console.log("[CLIPBOARD READ]: "+r);return r};
});},0);
