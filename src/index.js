"use strict";
const eWelink = require("ewelink-api");

var btn = document.getElementById("btn");
var mainDiv = document.getElementById("mainDiv");
var body = document.body;
var popup = document.getElementById("myForm");
var ventilador = document.getElementById("ventilador");
var ventIMG = `${__dirname}/src/assets/ventilador.gif`;
var ventParadoIMG = `${__dirname}/src/assets/ventilador_parado.gif`;

// let token = window.localStorage.token;
// let apiKey = window.localStorage.apiKey;
const deviceId = "10003d36eb";

async function logar() {
  // body.style.cursor = "wait";
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const connection = new eWelink({
    email: email,
    password: password,
    region: "us",
  });

  const credentials = await connection.getCredentials();

  console.log(credentials);
  // token = credentials.at;
  // apiKey = credentials.user.apikey;

  window.localStorage.setItem("token", credentials.at);
  window.localStorage.setItem("apiKey", credentials.user.apikey);

  popup.style.display = "none";
  mainDiv.style.display = "flex";

  // body.style.cursor = "auto";
  main();
}

async function getWebSocket(service) {
  return await service.openWebSocket(async (data) => {
    const resp = data;

    if (resp.action === "update" && resp.params.switch === "on") {
      currentdevice.state = true;
    }

    if (resp.action === "update" && resp.params.switch === "off") {
      currentdevice.state = false;
    }

    console.log(resp);
  });
}

const loading_state = {
  before: () => {
    body.style.cursor = "wait";
    btn.disabled = true;
    btn.style.cursor = "wait";
    ventilador.style.opacity = 0.5;
  },
  after: () => {
    body.style.cursor = "auto";
    btn.disabled = false;
    btn.style.cursor = "pointer";
    ventilador.style.opacity = 1;
  },
};

const connection = (token, apiKey) =>
  new eWelink({
    at: token,
    apiKey: apiKey,
    region: "us",
  });

let service;
let webSocket;

async function reload() {
  service = connection(window.localStorage.token, window.localStorage.apiKey);
  webSocket.close();
  webSocket = await getWebSocket(service);
  main(service);
}

if (!window.localStorage.token || !window.localStorage.apiKey) {
  mainDiv.style.display = "none";
  popup.style.display = "block";
  console.log("Usuario não logado, encaminhando para login.");
} else {
  service = connection(window.localStorage.token, window.localStorage.apiKey);

  main(service);
}

async function toggleDevice() {
  loading_state.before();

  let status;
  try {
    status = await service.toggleDevice(deviceId);
  } catch (error) {
    console.log("erro ao se conectar ao device");
    console.log(error);
    loading_state.after();
    return;
  }

  if (status.status == "ok") {
    currentdevice.state = !currentdevice.state;
  }

  console.log(status);

  loading_state.after();

  return status;
}

var currentdevice = {
  get state() {
    return this.value;
  },
  set state(value) {
    this.value = value;
    ventilador.src = value ? ventIMG : ventParadoIMG;
    console.log(`Estado Atual do device é ${value}`);
  },
};

async function main(service) {
  mainDiv.style.display = "flex";
  loading_state.before();

  try {
    webSocket = await getWebSocket(service);
  } catch (error) {
    console.log(error);
  }

  let deviceState;
  // console.log(service);
  // const cred = await service.getCredentials();
  // console.log(cred);
  try {
    console.log("Requisitando status do device...");
    deviceState = await service.getDevicePowerState(deviceId);
    console.log("Sucesso ao requisitar status do device.");
    console.log(deviceState);
    currentdevice.state = deviceState.state == "on";
  } catch (error) {
    console.log("Erro ao requisitar status do device.");
    console.log(error);
    loading_state.after();
    // return main(service);
  }

  loading_state.after();
}
