const AframeInput = {
  schema: {
    value: { type: "string", default: "" },
    id: { type: "string", default: "" },
  },
  init: function () {
    const { el, data } = this;

    el.setAttribute('id', `${data.id}-input`);
    el.setAttribute('mixin', 'shake');
    el.setAttribute('rounded-plane', {
      width: 2.25,
      height: 0.32,
      radius: 0.04,
      color: '#00FFFF'
    });

    const innerContainer = document.createElement('a-entity');
    innerContainer.setAttribute('position', '0 0 0.001');
    innerContainer.setAttribute('rounded-plane', {
      width: 2.23,
      height: 0.31,
      radius: 0.04,
      color: '#0A1E45'
    });

    const text = document.createElement('a-text');
    text.setAttribute('id', `${data.id}-text`);
    text.setAttribute('font', 'exo2bold');
    text.setAttribute('color', '#00FFFF');
    text.setAttribute('value', '');
    text.setAttribute('scale', '0.7 0.7 0.7');
    text.setAttribute('position', '-1.02 0.01 0');

    innerContainer.appendChild(text);
    el.appendChild(innerContainer);
  },
}

export default AframeInput;
