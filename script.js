const songUrls = {};
let songList;


fetch('./songs/')
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');

    console.log(links); // add this line to check if links has any elements

    for (const link of links) {
      const fileName = link.href.split('/').pop();
      if (fileName.endsWith('.mp3')) {
        const srtFileName = fileName.replace('.mp3', '.srt');
        const txtFileName = fileName.replace('.mp3', '.txt');
        songUrls[decodeURIComponent(fileName)] = { srt: decodeURIComponent(srtFileName), txt: decodeURIComponent(txtFileName) };
      }
    }
    console.log('first  ')
    console.log(Object.keys(songUrls));
    songList = Object.keys(songUrls);
    console.log(songUrls); // add this line to check if songUrls is being populated correctly

    // Add buttons to the song list dropdown
    const songListDropdown = document.getElementById('song-list');
    for (const songUrl of Object.keys(songUrls)) {
      const button = document.createElement('li');
      button.textContent = songUrl.replace('.mp3', '');
      button.onclick = () => switchSong(songUrl);
      songListDropdown.appendChild(button);
    }

    // Click the first song button by default
    const firstButton = document.querySelector('#song-list li');
    if (firstButton) {
      firstButton.click();
    }
  });

let intervalId;

function switchSong(songFilename) {
  const lyricsContainer = document.getElementById('lyrics-container');
  lyricsContainer.scrollTo({ top: 0, behavior: 'instant' });
  console.log(songFilename);
  const audio = document.getElementById('audio');
  const lyrics = document.getElementById('lyrics');
  audio.src = `songs/${songFilename}`;
  console.log(audio.src);

  // clear the previous interval
  clearInterval(intervalId);

  const songInfo = songUrls[songFilename];
  if (songInfo && songInfo.srt) {
    const srtFilename = songInfo.srt;
    const srtUrl = `songs/${srtFilename}`;
    const txtUrl = `songs/${songFilename.replace('.mp3', '.txt')}`;

    let url;
    let fileType;

    fetch(srtUrl)
      .then(response => {
        if (response.status === 404) {
          fileType = 'txt';
          url = txtUrl;
          return fetch(txtUrl);
        } else {
          fileType = 'srt';
          url = srtUrl;
          return response.text();
        }
      })
      .then(data => {
        if (fileType === 'srt') {
          // Parse the SRT file
          const srt = data.split(/\n\s*\n/).filter(Boolean).map(item => {
            const [id, time, ...textLines] = item.trim().split('\n');
            const [start, end] = time.split(' --> ').map(convertSrtTimeToSeconds);
            return { id: parseInt(id), start, end, text: textLines.join(' ') };
          });

          // assign the interval to the intervalId variable
          intervalId = setInterval(() => {
            const currentTime = audio.currentTime;
            const currentSrt = srt.find(item => item.start <= currentTime && item.end >= currentTime);
            if (currentSrt) {
              const currentIndex = srt.findIndex(item => item.id === currentSrt.id);
              lyrics.innerHTML = srt.map((item, index) => `<div class="lyric ${index === currentIndex ? 'active' : ''}">${item.text.replace(/<br>/g, '')}</div>`).join('');
              const lyricsContainer = document.getElementById('lyrics-container');
              const currentLyric = lyrics.querySelector('.lyric.active');
              const scrollY = currentLyric.offsetTop - lyricsContainer.offsetHeight / 2 + currentLyric.offsetHeight / 2;
              const behavior = audio.paused ? 'instant' : 'smooth';
              lyricsContainer.scrollTo({ top: scrollY, behavior });
            }
          }, 100);
        } else if (fileType === 'txt') {
          // Load the text file content into the template
          return fetch(url).then(response => response.text());
        }
      })
      .then(response => {
        if (fileType === 'txt') {
          // Render the text file content in the template
          lyrics.innerHTML = '<br><br><br><br>' + response.split('\n').map(line => `<div class="lyric">${line.trim()}</div>`).join('');

          // synchronize the scrolling with audio time
          intervalId = setInterval(() => {
            const currentTime = audio.currentTime;
            const totalDuration = audio.duration;
            const progressPercentage = (currentTime / totalDuration) * 100;
            const lyricsContainer = document.getElementById('lyrics-container');
            const containerHeight = lyricsContainer.offsetHeight;
            const lyricsHeight = lyrics.offsetHeight;
            const scrollY = (progressPercentage / 100) * (lyricsHeight - containerHeight);
            const behavior = audio.paused ? 'instant' : 'smooth';
            lyricsContainer.scrollTo({ top: scrollY, behavior });
          }, 100);
        }
      })
      .catch(error => console.error(error));
  } else {
    // handle the error here, e.g. show an error message
    console.error(`Error: no srt file found for song "${songFilename}"`);
  }
}


let currentSongIndex = 0;

function switchToNextSong() {
  currentSongIndex = (currentSongIndex + 1) % songList.length;
  if (songList.length > 0) {
    switchSong(songList[currentSongIndex]);
    document.getElementById('audio').autoplay = true; // autoplay the audio player
  }
}

function switchToPrevSong() {
  currentSongIndex = (currentSongIndex - 1 + songList.length) % songList.length;
  if (songList.length > 0) {
    switchSong(songList[currentSongIndex]);
    document.getElementById('audio').autoplay = true; // autoplay the audio player
  }
}

const audio = document.getElementById('audio');
audio.addEventListener('ended', switchToNextSong);

document.querySelector('.next').addEventListener('click', switchToNextSong);
document.querySelector('.prev').addEventListener('click', switchToPrevSong);

function convertSrtTimeToSeconds(time) {
  const [hours, minutes, seconds] = time.split(':').map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}

const audioWrapper = document.getElementById('audio-wrapper');
let timerId;

const prev = document.querySelector('.prev');
const next = document.querySelector('.next');

if (prev && next) {
  prev.addEventListener('mouseenter', () => {
    clearTimeout(timerId);
  });

  prev.addEventListener('mouseleave', () => {
    timerId = setTimeout(() => {
      prev.classList.remove('show-controls');
    }, 3000);
  });

  next.addEventListener('mouseenter', () => {
    clearTimeout(timerId);
  });

  next.addEventListener('mouseleave', () => {
    timerId = setTimeout(() => {
      next.classList.remove('show-controls');
    }, 3000);
  });
}

if (audioWrapper) {
  audioWrapper.addEventListener('mouseenter', () => {
    clearTimeout(timerId);
  });

  audioWrapper.addEventListener('mouseleave', () => {
    timerId = setTimeout(() => {
      document.getElementById('audio').controls = false;
    }, 3000);
  });
}

function activateAudioOnMouseMove() {
  // Get the audio element
  const audio = document.getElementById('audio');

  // Get the prev and next elements
  const prev = document.querySelector('.prev');
  const next = document.querySelector('.next');

  // Add a mousemove event listener to the body
  document.body.addEventListener('mousemove', function () {
    // Show the audio, prev, and next controls by adding a class to each element
    audio.classList.add('show-controls');
    prev.classList.add('show-controls');
    next.classList.add('show-controls');

    // Set a timeout to hide the audio, prev, and next controls after 3 seconds
    setTimeout(function () {
      audio.classList.remove('show-controls');
      prev.classList.remove('show-controls');
      next.classList.remove('show-controls');
    }, 3000);

    // Hide the dropdown button by adding a class to the dropdown element
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.remove('hide-controls');

    // Set a timeout to show the dropdown button after 3 seconds
    setTimeout(function () {
      dropdown.classList.add('hide-controls');
    }, 3000);
  });
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowRight') {
    switchToNextSong();
  } else if (event.key === 'ArrowLeft') {
    switchToPrevSong();
  }
});