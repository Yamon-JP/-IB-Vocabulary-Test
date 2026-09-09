const UI = {
  render(message) {
    const app = document.getElementById('app');
    if (app) app.innerHTML += `<p>${message}</p>`;
  }
};
