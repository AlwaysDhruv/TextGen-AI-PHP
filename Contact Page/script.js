const devs = [
  {
    name: "Dhruv B. Sonavane",
    github: "https://github.com/AlwaysDhruv",
    linkedin: "https://www.linkedin.com/in/dhruv-sonavane-50559b278/",
    img: "https://avatars.githubusercontent.com/AlwaysDhruv"
  },
  {
    name: "Huzefa S. Rawat",
    github: "https://github.com/huzu173",
    linkedin: "https://www.linkedin.com/in/huzaifa-ravat-556728293/",
    img: "https://avatars.githubusercontent.com/huzu173"
  }
];

const container = document.getElementById("devCards");

devs.forEach(dev => {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img src="${dev.img}" alt="${dev.name}">
    <h2>${dev.name}</h2>
    <a href="${dev.github}" target="_blank">GitHub</a>
    <a href="${dev.linkedin}" target="_blank">LinkedIn</a>
  `;
  container.appendChild(card);
});