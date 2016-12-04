function exportData() {
    var data = '';
    for (var i=1;i<=2;i++) {
        var sep = '';
        for (var j=1;j<=4;j++) {
            data +=  sep + document.getElementById(i + '_' + j).value;
            sep = ',';
        }
        data += '\r\n';
    }
    var exportLink = document.createElement('a');
    exportLink.setAttribute('href', 'data:text/csv;base64,' + window.btoa(data));
    exportLink.appendChild(document.createTextNode('test.csv'));
}
