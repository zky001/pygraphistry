from .pygraphistry import util

node_id_key = u'_bolt_node_id_key'
start_node_id_key = u'_bolt_start_node_id_key'
end_node_id_key = u'_bolt_end_node_id_key'
relationship_id_key = u'_bolt_relationship_id'

def isNeotime(v):
    try:
        return v.__module__ == 'neotime'
    except:
        return False


def stringifyNeotimes(df):
    #Otherwise currently encountering a toString error
    import neotime
    df2 = df.copy()
    for c in df.columns:
        df2[c] = df[c].apply(lambda v: str(v) if isNeotime(v) else v)
    return df2  

def to_bolt_driver(driver=None):
    if driver is None:
        return None
    try:
        from neo4j import GraphDatabase, Driver
        if isinstance(driver, Driver):
            return driver
        return GraphDatabase.driver(**driver)
    except ImportError:
        raise BoltSupportModuleNotFound()

def bolt_graph_to_edges_dataframe(graph):
    import pandas as pd
    df = pd.DataFrame([
        util.merge_two_dicts(
            { key: value for (key, value) in relationship.items() },
            {
                relationship_id_key:    relationship.id,
                start_node_id_key:          relationship.start_node.id,
                end_node_id_key:     relationship.end_node.id
            }
        )
        for relationship in graph.relationships
    ])
    return stringifyNeotimes(df)


def bolt_graph_to_nodes_dataframe(graph):
    import pandas as pd
    df = pd.DataFrame([
        util.merge_two_dicts(
            { key: value for (key, value) in node.items() },
            {
                node_id_key: node.id
            }
        )
        for node in graph.nodes
    ])
    return stringifyNeotimes(df)

class BoltSupportModuleNotFound(Exception):
    def __init__(self):
        super(BoltSupportModuleNotFound, self).__init__(
            "The neo4j module was not found but is required for pygraphistry bolt support. Try running `!pip install pygraphistry[bolt]`."
        )