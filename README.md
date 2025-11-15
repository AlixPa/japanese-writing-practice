# japanese-writing-practice
A writing dictation application that lets you play dictations with custom configurations or generate your own dictations based on the vocabulary you want to practice.

By default, some dictations are provided based on WaniKani vocabulary per level.

## Access the application

Application is available at:

https://jwp.alixparadis.com/

## Getting Started

Before running the application, ensure Docker Desktop is installed (and latest version!):

1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Follow the installation instructions for your operating system
3. Start Docker Desktop and verify that it is running

---

Start the application with:

```shell
make app
```

Then access it at http://localhost:5173

---

Stop the application using:

```shell
make stop
```

Note: stopping the application does not delete your configurations, audio files, or other data.

## Features

### Dictation Playback

Follow a dictation on the “Dictation” tab with standard controls: Play, Pause, Resume, etc.

![](static/dict.gif)

### Dictation Configuration

In the “Dictation Configuration” tab, customize how each element of the dictation is played. 

There are three main elements:
- Full Dictation: Reads the entire dictation at a selectable speed.
- Wait: Inserts silence for a chosen duration.
- Sentence by Sentence: Plays the dictation in smaller chunks (delimited by commas, dots, etc.) with configurable gaps between chunks and chunk repeat.

![](static/conf.gif)

### Custom Generation

This feature is not yet implemented. It will later allow you to input a list of vocabulary to generate a dictation, then generate audio using a selectable speaker voice.

## About the code

The whole infra / DB / Server (backend) has been coded by my little hands, so feel free to open any issues if you find anything. (There are certainly bugs here and there, but they are hand-made <3)

The whole frontend has been massively gpt-generated (except for some configs/proxies/file structure), so feel free to not read it. I promise I will someday learn React but you cannot change my mind on the fact that React enjoyers are psychopaths.