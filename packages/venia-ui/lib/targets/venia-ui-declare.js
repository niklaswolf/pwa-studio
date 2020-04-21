module.exports = targets => {
    targets.declare({
        richContentRenderers: new targets.types.Sync(['renderers']),
        routes: new targets.types.SyncWaterfall(['routes'])
    });
};
