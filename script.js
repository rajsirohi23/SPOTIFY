console.log('LetswriteJavaScript');
let currentSong = new Audio;
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/public/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/public/${folder}/`)[1])
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" width="34" src="public/img/music.svg" alt="">
        <div class="info">
            <div> ${song.replaceAll("%20", " ")}</div>
            <div>Harry</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="public/img/play.svg" alt="">
        </div> </li>`;;
    }

    //Attach an event listner to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })

    return songs
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/public/${currFolder}/` + track
    if (!pause) {
        currentSong.play()
        play.src = "public/img/pause.svg"
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    console.log("displaying albums");
    try {
        let a = await fetch(`/public/songs/`);
        if (!a.ok) {
            throw new Error(`HTTP error! status: ${a.status}`);
        }
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        if (!cardContainer) {
            console.error("cardContainer not found");
            return;
        }

        // Clear existing cards before adding new ones
        cardContainer.innerHTML = "";

        let array = Array.from(anchors);
        const uniqueFolders = new Set(); // Use a Set to ensure uniqueness
        const folderPromises = array
            .filter((e) => e.href.includes("/public/songs"))
            .map(async (e) => {
                console.log("href:", e.href);
                let folder = e.href.split("/").filter(part => part !== "").slice(-1)[0];
                console.log("Folder:", folder);

                // Skip if folder already processed
                if (uniqueFolders.has(folder)) {
                    return null;
                }
                uniqueFolders.add(folder);

                let infoUrl = `/public/songs/${folder}/info.json`;
                try {
                    let infoResponse = await fetch(infoUrl);
                    if (!infoResponse.ok) {
                        throw new Error(`HTTP error! status: ${infoResponse.status}`);
                    }
                    let info = await infoResponse.json();
                    return { folder, info };
                } catch (error) {
                    console.error(`Error fetching ${infoUrl}:`, error);
                    return null;
                }
            });

        const folderInfos = await Promise.all(folderPromises);

        folderInfos
            .filter((info) => info !== null)
            .forEach(({ folder, info }) => {
                const card = document.createElement("div");
                card.dataset.folder = folder;
                card.className = "card";

                card.innerHTML = `
                    <div class="play">
                        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="0" cy="0" r="0" fill="green" />
                            <polygon points="35,25 75,50 35,75" fill="black" />
                        </svg>
                    </div>
                    <img src="/public/songs/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                `;

                cardContainer.appendChild(card);
            });

        Array.from(document.getElementsByClassName("card")).forEach((e) => {
            e.addEventListener("click", async (item) => {
                console.log("Fetching Songs");
                try {
                    songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                    playMusic(songs[0]);
                } catch (error) {
                    console.error("Error fetching songs:", error);
                }
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

// Ensure displayAlbums is called only once on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayAlbums);
} else {
    displayAlbums(); // DOMContentLoaded already fired
}

async function main() {
    await getSongs("songs/cs");
    playMusic(songs[0], true);

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "public/img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "public/img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburgerContainer").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("public/img/mute.svg", "public/img/volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("public/img/volume.svg")) {
            e.target.src = e.target.src.replace("public/img/volume.svg", "public/img/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("public/img/mute.svg", "public/img/volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 50;
        }
    });
}

// Function to display username if logged in
function displayUsername() {
    const username = localStorage.getItem("username");
    if (username) {
        const userProfile = document.querySelector(".user-profile");
        userProfile.innerHTML = `<div class="user-circle">${username.charAt(0).toUpperCase()}</div><div class="user-name">${username}</div>`;
        const logoutDiv = document.createElement('div');
        logoutDiv.id = 'logout-popup';
        logoutDiv.innerHTML = `<button id="logoutButton">Logout</button>`;
        logoutDiv.style.display = 'none';

        // Minimal styling for the popup div
        logoutDiv.style.position = 'absolute';
        logoutDiv.style.right = '0';
        logoutDiv.style.top = '100%'; // Place below username
        logoutDiv.style.zIndex = '10';
        logoutDiv.style.padding = '5px 0px'; // Reduced padding

        const logoutButton = logoutDiv.querySelector('#logoutButton');
        logoutButton.style.backgroundColor = '#1DB954'; // Spotify green
        logoutButton.style.color = 'white';
        logoutButton.style.border = 'none';
        logoutButton.style.padding = '5px 10px'; // Reduced button padding
        logoutButton.style.borderRadius = '3px';
        logoutButton.style.cursor = 'pointer';
        logoutButton.style.fontSize = '14px';
        logoutButton.style.transition = 'background-color 0.3s ease';

        logoutButton.addEventListener('mouseover', () => {
            logoutButton.style.backgroundColor = '#1ED760'; // Lighten on hover
        });

        logoutButton.addEventListener('mouseout', () => {
            logoutButton.style.backgroundColor = '#1DB954';
        });

        userProfile.appendChild(logoutDiv);

        const loginButton = document.querySelector(".loginbtn");
        const signupButton = document.querySelector(".signupbtn");
        if (loginButton && signupButton) {
            loginButton.style.display = "none";
            signupButton.style.display = "none";
        }

        userProfile.addEventListener('click', () => {
            const logoutPopup = document.getElementById('logout-popup');
            logoutPopup.style.display = logoutPopup.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById("logoutButton").addEventListener("click", logout);
    }
}

// Function to handle logout
function logout() {
    localStorage.removeItem("username");
    const userProfile = document.querySelector(".user-profile");
    userProfile.innerHTML = "";
    const loginButton = document.querySelector(".loginbtn");
    const signupButton = document.querySelector(".signupbtn");
    if (loginButton && signupButton) {
        loginButton.style.display = "block";
        signupButton.style.display = "block";
    }
}

// Call displayUsername on page load
document.addEventListener("DOMContentLoaded", displayUsername);

// Handle user signup and login
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    if (signupForm) {
        signupForm.addEventListener("submit", event => {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const user = {
                username: username,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            };
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("username", username);
            alert("Signup successful! Redirecting...");
            window.location.href = "index.html";
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();
            const storedUser = JSON.parse(localStorage.getItem("user"));
            const inputUsername = document.getElementById("loginUsername").value;
            const inputPassword = document.getElementById("loginPassword").value;

            if (storedUser && (inputUsername === storedUser.username || inputUsername === storedUser.email) && inputPassword === storedUser.password) {
                localStorage.setItem("username", storedUser.username);
                alert("Login successful! Redirecting...");
                window.location.href = "index.html";
            } else {
                alert("Invalid username or password.");
            }
        });
    }
});

main();
