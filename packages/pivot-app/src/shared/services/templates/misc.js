import { constructFieldString, SplunkPivot } from './SplunkPivot';
import _ from 'underscore';
import stringhash from 'string-hash';
import { Observable} from 'rxjs';


export const searchSplunk = new SplunkPivot({
    id: 'search-splunk-plain',
    name: 'Search Splunk',
    pivotParameterKeys: ['query'],
    pivotParametersUI: {
        'query': {
            inputType: 'text',
            label: 'Query:',
            placeholder: 'error'
        }
    },
    toSplunk: function (pivotParameters, pivotCache) {
        return `search ${pivotParameters['query']} ${constructFieldString(this)} | head 500`;
    },
    encodings: {
        point: {
            pointColor: (node) => {
                node.pointColor = stringhash(node.type) % 12;
            }
        }
    }
});

export const searchSplunkMap = new SplunkPivot({
    id: 'search-splunk-source-dest',
    name: 'Graphviz Expand',
    pivotParameterKeys: ['src', 'dst', 'pivot'],
    pivotParametersUI: {
        'src': {
            inputType: 'text',
            label: 'Source entity:',
            placeholder: '"metadata.dataset"'
        },
        'dst': {
            inputType: 'text',
            label: 'Destination:',
            placeholder: '"err.stackArray{0}.file"'
        },
        'pivot': {
            inputType: 'pivotCombo',
            label: 'Pivot:',
        }
    },
    toSplunk: function(pivotParameters, pivotCache) {
        const source = pivotParameters['src'];
        const dest = pivotParameters['dst'];
        const subsearch = `[
            | loadjob "${pivotCache[pivotParameters.pivot].splunkSearchId}"
            | dedup ${source}
        ]`;
        return `search ${subsearch}
            | fields ${source}, ${dest}
            | fields  - _*`;
    },
    encodings: {
        point: {
            pointColor: (node) => {
                node.pointColor = stringhash(node.type) % 12;
            }
        }
    }
});

const DATASET_ERROR_NODE_COLORS = {}
    /*    'dataset': 1,
    'msg': 5,
    'EventID': 7
}*/

export const searchGraphviz = new SplunkPivot({
    id: 'search-graphviz-logs',
    name: 'Graphviz Search',
    pivotParameterKeys: ['query2', 'level'],
    pivotParametersUI: {
        'query2': {
            inputType: 'text',
            label: 'Query:',
            placeholder: 'twitter'
        },
        'level': {
            label: 'Severity >=',
            inputType: 'combo',
            options: [
                {value: 30, label: 'info'},
                {value: 40, label: 'warn'},
                {value: 50, label: 'error'},
            ]
        }
    },
    toSplunk: function (pivotParameters, pivotCache) {
        const q = pivotParameters['query2'];
        const l = pivotParameters['level'];
        return `search (host=staging* OR host=labs*) source="/var/log/graphistry-json/*.log" ${q} level >= ${l}
            | head 1000
            | spath output=File0 path="err.stackArray{0}.file"
            | spath output=File1 path="err.stackArray{1}.file"
            | eval File00=File0 | eval file=if(File00="null", File1, File0)
            ${constructFieldString(this)}`
    },
    encodings: {
        point: {
            pointColor: function(node) {
                node.pointColor = DATASET_ERROR_NODE_COLORS[node.type];
                if (node.pointColor === undefined) {
                    node.pointColor = stringhash(node.type) % 12;
                }
            }
        }
    },
    connections: ['level', 'msg', 'err.message', 'file', 'module', 'metadata.dataset'],
    attributes: ['time']
});
