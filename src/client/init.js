class Inits {
    constructor() {
        this.preCacheGraphics = {};
        this.graphics = {};
        this.objs = {};
        this.mapData = {};
        this.mapa = {};

        this.mapasCargados = 0;
        this.completedCount = 0;
    }

    loadMaps = async () => {
        var arLoadMaps = [];
        
        for (var i = 1; i <= 15; i++) {
            arLoadMaps.push(inits.loadMap(i));
        }

        await Promise.all(arLoadMaps);
    };

    loadMap = async map => {
        const response = await fetch("/public/static/mapas/mapa_" + map + ".map");
        const result = await response.json();

        this.mapa[map] = result['tiles'];

        this.createMapData(map);

        this.mapasCargados++;

        if (this.react) {
            this.react.setState({
                mapasCargados: this.mapasCargados
            });
        }
    };

    createMapData = idMap => {
        this.mapData[idMap] = [];

        for (var y = 1; y <= 100; y++) {
            this.mapData[idMap][y] = [];

            for (var x = 1; x <= 100; x++) {
                this.mapData[idMap][y][x] = {
                    id: 0
                };
            }
        }
    };

    loadImage = numFile => {
        return new Promise((resolve, reject) => {
            var image = new Image();

            image.src = "/public/static/graficos/" + numFile + ".png";

            image.onload = () => {
                inits.preCacheGraphics[numFile] = image;

                resolve(true);
            };

            image.onerror = e => {
                reject(true);
            };
        });
    };

    loadObjs = async () => {
        const response = await fetch("/public/static/init/objs.json");
        const result = await response.json();

        this.objs = result;
    };

    loadGraphics = async () => {
        const response = await fetch("/public/static/init/graficos.json");
        const result = await response.json();

        this.graphics = result;
    };
}