$('.selectpicker').selectpicker();
solicitarAcessoGPS();

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
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
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
        console.error("Erro ao obter localização: " + errorMessage);
    });
}
function solicitarAcessoGPS() {
    // Verifica se a API de Geolocalização está disponível no navegador
    if ("geolocation" in navigator) {
        // Solicita a localização do usuário
        navigator.geolocation.getCurrentPosition(
            function (position) {
                // Sucesso - informações da localização
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                console.log('Latitude: ' + latitude);
                console.log('Longitude: ' + longitude);
            },
            function (error) {
                // Falha - erro ao obter a localização
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.error("Usuário negou a solicitação de geolocalização.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.error("Informação de localização não disponível.");
                        break;
                    case error.TIMEOUT:
                        console.error("A solicitação para obter a localização expirou.");
                        break;
                    case error.UNKNOWN_ERROR:
                        console.error("Ocorreu um erro desconhecido.");
                        break;
                }
            }
        );
    } else {
        console.error("Geolocalização não é suportada por este navegador.");
    }
}

pegarLocalizacaoAtual();

function searchPlaces(query, callback) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                callback(data)
            }
        });
}

document.getElementById('pont_ini').addEventListener('input', function () {
    const query = this.value;
    if (query.length > 2) {
        usarPosicaoAtual = false;
        searchPlaces(query, function (pontos) {
            adicionarItemsNasOpcoes("#opcoes-ini", pontos, "item-ini")
        });

    } else if (query.length <= 0) {
        document.querySelector("#opcoes-ini").innerHTML = "";
        document.querySelector("#opcoes-ini").classList.remove("active");
    }
});

document.getElementById('pont_sai').addEventListener('input', function () {
    const query = this.value;
    if (query.length > 2) {
        searchPlaces(query, function (pontos) {
            adicionarItemsNasOpcoes("#opcoes-saida", pontos, "item-sai")
        });

    } else if (query.length <= 0) {
        document.querySelector("#opcoes-saida").innerHTML = "";
        document.querySelector("#opcoes-saida").classList.remove("active");
    }
});

function adicionarEventoDeCliqueNasOpcoesDeDestinoFinal() {
    const opcoes = document.querySelectorAll(".item-sai");
    opcoes.forEach(opc => {
        opc.addEventListener("click", () => {
            const lat = opc.getAttribute("data-lat");
            const long = opc.getAttribute("data-long");
            pontoSaida = L.latLng(lat, long);
            if (pontoInicial) {
                if (control) {
                    control.setWaypoints([pontoInicial, pontoSaida]);
                }
            }

        });
    });
}
function adicionarEventoDeCliqueNasOpcoesDeDestinoInicial() {
    const opcoes = document.querySelectorAll(".item-ini");
    opcoes.forEach(opc => {
        opc.addEventListener("click", () => {
            const lat = opc.getAttribute("data-lat");
            const long = opc.getAttribute("data-long");
            pontoInicial = L.latLng(lat, long);
            if (pontoSaida) {
                if (control) {
                    control.setWaypoints([pontoInicial, pontoSaida]);
                }
            }
        });
    });
}


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
    console.log(pontoSaida);
    if (pontoInicial && pontoSaida) {
        if (usarPosicaoAtual) {
            pontoInicial = L.latLng(latitudeAtual, longitudeAtual);
        }
        if (control) {
            control.setWaypoints([pontoInicial, pontoSaida]);
        } else {
            control = L.Routing.control({
                waypoints: [pontoInicial, pontoSaida],
                routeWhileDragging: true,
                geocoder: L.Control.Geocoder.nominatim(),
                createMarker: function () { return null; }
            }).addTo(map);
        }
        document.querySelector("#pont_ini").value = "";
        document.querySelector("#pont_sai").value = "";
        $("#modalBuscar").modal("hide");
    } else {
        console.log('Defina o ponto inicial e o ponto de saída antes de iniciar a rota.');
    }
});

document.querySelector("#local_atual").addEventListener("click", function () {
    usarPosicaoAtual = !usarPosicaoAtual;
    if (usarPosicaoAtual)
        document.querySelector("#pont_ini").value = "Posição atual";
});

document.querySelector("#ir-para-local-atual").addEventListener("click", function () {
    pegarLocalizacaoAtual();
});


function adicionarItemsNasOpcoes(idOpcao, items, typeClass) {
    const opcoesArea = document.querySelector(idOpcao);
    opcoesArea.innerHTML = "";
    opcoesArea.classList.add("active");
    items.forEach(element => {
        const div = document.createElement("div");
        div.classList.add("item");
        div.setAttribute("data-lat", element.lat);
        div.setAttribute("data-long", element.lon);
        div.classList.add(typeClass);
        div.innerHTML = element.display_name;
        opcoesArea.appendChild(div);
    });
    adicionarEventoDeCliqueNasOpcoesDeDestinoFinal();
    adicionarEventoDeCliqueNasOpcoesDeDestinoInicial();
}

