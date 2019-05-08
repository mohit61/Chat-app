const socket = io();

// elements
const messageForm = document.querySelector(".form");
const messageFormButton = document.querySelector("button");
const messageFormInput = document.querySelector("input");
// element for send location
const sendLocationButton = document.querySelector("#send-location");
const messages = document.querySelector("#messages");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

messageForm.addEventListener("submit", e => {
  e.preventDefault();
  //Disable form
  // 1st argument is to disble it and 2nd to give value/name
  messageFormButton.setAttribute("disabled", "disabled");

  // message is the value of name property that is provided in input tag
  const message = e.target.message.value;
  socket.emit("sendMessage", message, message => {
    // enable form
    messageFormButton.removeAttribute("disabled");
    // clear the input
    messageFormInput.value = "";
    // to bring the focus back to input so we can type again
    messageFormInput.focus();
    console.log(message);
  });
});

// Options
// location is a global object and location.search
// returns the query that is there in url, u can try in console.
// ignoreQueryPrefix makes the ? at the starting in the query go away
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  // new message element
  const newMessage = messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom); // convert string to int
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    // this below line scroll down to bottom
    // above logic is to find whether user is reading some
    // old message, so that we do not autoscroll when new message
    // arrives.
    // and if user is already at the bottom , then autoscroll
    messages.scrollTop = messages.scrollHeight;
  }
};
socket.on("message", message => {
  console.log(message);
  // second argument to render is object and we can add key
  // value pairs , where key is the attribute that we pass, in
  // this case message which is coming from index.html <p></p> inside
  // script tag and value is the message that we send
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    // this will format time , h for hour, mm for minute and a for am and pm
    CreatedAt: moment(message.CreatedAt).format("h:mm a")
  });
  // this is the way to add html , beforeend means to add before the end of div tag of messages
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room: room,
    users: users
  });
  document.querySelector("#sidebar").innerHTML = html;
});

socket.on("locationMessage", url => {
  console.log(url);
  const html = Mustache.render(locationMessageTemplate, {
    username: url.username,
    url: url.url,
    CreatedAt: moment(url.CreatedAt).format("h mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

sendLocationButton.addEventListener("click", () => {
  // disable the button
  sendLocationButton.setAttribute("disabled", "disabled-location");
  if (!navigator.geolocation) {
    return alert("Your browser does not support Geolocation!");
  }
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      "send-location",
      {
        log: position.coords.longitude,
        lat: position.coords.latitude
      },
      message => {
        // enable the button
        sendLocationButton.removeAttribute("disabled");
        console.log(message);
      }
    );
  });
});

// to emit event that server will listen
socket.emit("join", { username, room }, error => {
  if (error) {
    // if there is error then we will alert
    alert(error);
    // and this will redirect to root of site.
    location.href = "/";
  }
});
