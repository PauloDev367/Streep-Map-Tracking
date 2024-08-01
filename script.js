const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variáveis globais
let pontoInicial;
let pontoSaida;
let control;
let latitudeAtual;
let longitudeAtual;
let usarPosicaoAtual = true;

function obterLocalizacaoAtual(successCallback, errorCallback) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                if (successCallback) {
                    latitudeAtual = latitude;
                    longitudeAtual = longitude;
                    successCallback({
                        latitude: latitude,
                        longitude: longitude
                    });
                }
            },
            function (error) {
                if (errorCallback) {
                    errorCallback(error.message);
                }
            }
        );
    } else {
        if (errorCallback) {
            errorCallback("Geolocalização não está disponível.");
        }
    }
}

function pegarLocalizacaoAtual() {
    obterLocalizacaoAtual(function (position) {
        const latitude = position.latitude;
        const longitude = position.longitude;
        map.setView([latitude, longitude], 16);

        L.marker([latitude, longitude]).addTo(map)
            .bindPopup('Você está aqui!')
            .openPopup();

        pontoInicial = L.latLng(latitude, longitude);
        document.getElementById('pont_ini').value = `Posição atual`;

        if (pontoSaida) {
            if (control) {
                control.setWaypoints([pontoInicial, pontoSaida]);
            }
        }

    }, function (errorMessage) {
        console.log("Erro ao obter localização: " + errorMessage);
    });
}

// Chamar a função para definir a localização atual ao carregar a página
pegarLocalizacaoAtual();

// Função para buscar locais e definir ponto
function searchPlaces(query, callback) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const result = data[0];
                const ponto = L.latLng(result.lat, result.lon);
                if (callback) {
                    callback(ponto);
                }
                console.log('Local encontrado:', result.display_name);
            }
        });
}

document.getElementById('pont_ini').addEventListener('input', function () {
    const query = this.value;
    if (query.length > 2) {
        searchPlaces(query, function (ponto) {
            pontoInicial = ponto;
            if (pontoSaida) {
                if (control) {
                    control.setWaypoints([pontoInicial, pontoSaida]);
                }
            }
        });
    }
});

document.getElementById('pont_sai').addEventListener('input', function () {
    const query = this.value;
    if (query.length > 2) {
        searchPlaces(query, function (ponto) {
            pontoSaida = ponto;
            if (pontoInicial) {
                if (control) {
                    control.setWaypoints([pontoInicial, pontoSaida]);
                }
            }
        });
    }
});

document.getElementById('btn-buscar').addEventListener('click', function () {
    const queryIni = document.getElementById('pont_ini').value;
    const querySai = document.getElementById('pont_sai').value;

    if (queryIni.length > 2) {
        searchPlaces(queryIni, function (ponto) {
            pontoInicial = ponto;
            if (pontoSaida) {
                if (control) {
                    control.setWaypoints([pontoInicial, pontoSaida]);
                }
            }
        });
    }

    if (querySai.length > 2) {
        searchPlaces(querySai, function (ponto) {
            pontoSaida = ponto;
            if (pontoInicial) {
                if (control) {
                    control.setWaypoints([pontoInicial, pontoSaida]);
                }
            }
        });
    }
});

document.getElementById('btn-iniciar').addEventListener('click', function () {
    if (pontoInicial && pontoSaida) {
        if(usarPosicaoAtual){
            pontoInicial = L.latLng(latitudeAtual, longitudeAtual);
        }
        if (control) {
            control.setWaypoints([pontoInicial, pontoSaida]);
        } else {
            control = L.Routing.control({
                waypoints: [pontoInicial, pontoSaida],
                routeWhileDragging: true,
                geocoder: L.Control.Geocoder.nominatim(),
                createMarker: function () { return null; } // Remove o marcador padrão
            }).addTo(map);
        }
        document.querySelector("#pont_ini").value = "";
        document.querySelector("#pont_sai").value = "";
    } else {
        console.log('Defina o ponto inicial e o ponto de saída antes de iniciar a rota.');
    }
});

document.querySelector("#local_atual").addEventListener("click", function () {
    usarPosicaoAtual = !usarPosicaoAtual;
    if (usarPosicaoAtual)
        document.querySelector("#pont_ini").value = "Posição atual";
});