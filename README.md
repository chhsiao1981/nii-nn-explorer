# nii-nn-explorer

`nii-nn-explorer` intends to explore deep neural network models for 3D medical images by geometrically aligning each step, including preprocessing / layers in the model / postprocess,
to the input images.

## Getting Started

You can go to [The Demo Site](https://www.nii-nn-explorer.dev) to feel how `nii-nn-explorer` works.

## Overview

`nii-nn-explorer` is the visualization frontend for [nn-extractor](https://github.com/chhsiao1981/nn-extractor), specifically for the applications for 3D medical images. Given a 3D medical image and a deep neural network model, we would like to know **why** the model generates the output, through deep diving the relationship of each step in the whole prediction process.

Currently it reaches a milestone of demonstrating the feasibility of geometrically alignment with the input images.

## Usage

`nii-nn-explorer` is based on [vite](https://vite.dev/), [niivue](https://github.com/niivue/niivue), [d3js](https://d3js.org/), and [mui](https://mui.com/).

After setting up [vite](https://vite.dev/guide/) development environment, we can setup `nii-nn-explorer` through the following steps:

* `git clone` this repository to your local directory.
* `npm install`
* `cp -R config.tmpl node_modules/config`
* update configuration in `node_modules/config/index.ts`.
* `npm start`
