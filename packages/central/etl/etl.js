var debug    = require('debug')('graphistry:central:etl:etl');
var _        = require('underscore');

var vgraph   = require('./vgraph.js');
var vgwriter = require('../node_modules/graph-viz/js/libs/VGraphWriter.js');
var config   = require('config')();


// Convert JSON edgelist to VGraph then upload VGraph to S3 and local /tmp
// JSON * HTTP.Response
function etl(msg, res) {
    debug('ETL for', msg.name);
    //debug('Data', msg.labels);

    var vg = vgraph.fromEdgeList(
        msg.graph,
        msg.labels,
        msg.bindings.sourceField,
        msg.bindings.destinationField,
        msg.bindings.idField,
        msg.name
    );

    var metadata = {
        name: msg.name,
        type: 'vgraph',
        config: {
            simControls: 'netflow',
            scene: 'netflow',
            mapper: 'debugMapper'
        }
    };

    var cmd = config.HTTP_LISTEN_ADDRESS === 'localhost' ? 'cacheVGraph' : 'uploadVGraph';
    return vgwriter[cmd](vg, metadata)
        .then(_.constant(msg));

}

// Handler for ETL requests on central/etl
function post(req, res) {
    var data = "";

    req.on('data', function (chunk) {
        data += chunk;
    });

    req.on('end', function () {
        var fail = function (err) {
            console.error('etl post fail', (err||{}).stack);
            res.send({
                sucess: false,
                msg: JSON.stringify(err)
            });
        };

        try {
            etl(JSON.parse(data))
                .then(
                    function (msg) {
                        debug('etl done, notifying client to proceed');
                        debug('msg', msg);
                        res.send({ success: true, datasetName: msg.name });
                        debug('notified');
                    })
                .then(function () { debug('notified'); }, fail);
        } catch (err) {
            fail(err);
        }
    });
}

module.exports = {
    post: post
}
