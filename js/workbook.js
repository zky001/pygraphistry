'use strict';

var path    = require('path');
var Rx      = require('rx');

var persist     = require('./persist.js');

var WorkbookDocName = 'workbook.json';

module.exports = {
    loadDocument: function (workbookSpecifier) {
        var workbookRoot = new persist.ContentSchema().subSchemaForWorkbook(workbookSpecifier);
        return Rx.Observable.fromPromise(workbookRoot.download(WorkbookDocName)).map(function (data) {
            return JSON.parse(data);
        });
    },
    saveDocument: function (workbookSpecifier, workbookDoc) {
        var workbookRoot = new persist.ContentSchema().subSchemaForWorkbook(workbookSpecifier);
        return workbookRoot.uploadToS3(WorkbookDocName, JSON.stringify(workbookDoc));
    },
    /** Describes URL parameters that can persist across save/reload instead of just override per view: */
    URLParamsThatPersist: ['dataset', 'datasetname', 'layout', 'scene', 'controls', 'mapper', 'device']
};
