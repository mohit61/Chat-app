const generateMessage = (username, text) => {
  return { username: username, text: text, CreatedAt: new Date().getTime() };
};

const generateLocationMessage = (username, url) => {
  return { username: username, url: url, CreatedAt: new Date().getTime() };
};

module.exports = {
  generateMessage,
  generateLocationMessage
};
