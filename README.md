# nii-nn-explorer

`nii-nn-explorer` intends to explore deep neural network models for 3D medical images by geometrically aligning each step, including preprocessing / layers in the model / postprocess,
to the input images.

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

## Demo Site

You can find some preliminary demo at [https://www.nii-nn-explorer.dev](https://www.nii-nn-explorer.dev).

The data used in the demo site include the training data from:

* MGHNICH_262 from [BOston Neonatal Brain Injury Data for Hypoxic Ischemic Encephalopathy (BONBID-HIE): I. MRI and Lesion Labeling](https://zenodo.org/records/10602767).
* 00097-000 from [BraTS-PEDs 2025 Challenge](https://www.synapse.org/Synapse:syn64153130/wiki/631455).

## Reference
1. R. Bao, Y. Song, S. V. Bates, R. J. Weiss, A. N. Foster, C. Jaimes, S. Sotardi, Y. Zhang, R. L. Hirschtick, P. E. Grant, and Y. Ou, "BOston Neonatal Brain Injury
Data for Hypoxic Ischemic Encephalopathy (BONBID-HIE): I. MRI and Lesion Labeling", Sci. Data 12, 53 (2025), [https://doi.org/10.1038/s41597-024-03986-7](https://doi.org/10.1038/s41597-024-03986-7).
2. A. F. Kazerooni, N. Khalili, X. Liu, D. Gandhi, Z. Jiang, S. M. Anwar, J. Albrecht, M. Adewole, U. Anazodo, H. Anderson, U. Baid, T. Bergquist, A. J. Borja, E. Calabrese, V. Chung, G.-M. Conte, F. Dako, J. Eddy, I. Ezhov, A. Familiar, K. Farahani, A. Franson, A. Gottipati, S. Haldar, J. E. Iglesias, A. Janas, E. Johansen, B. V. Jones, N. Khalili, F. Kofler, D. LaBella, H. A. Lai, K. V. Leemput, H. B. Li, N. Maleki, A. S. McAllister, Z. Meier, B. Menze, A. W. Moawad, K. K. Nandolia, J. Pavaine, M. Piraud, T. Poussaint, S. P. Prabhu, Z. Reitman, J. D. Rudie, M. Sanchez-Montano, I. S. Shaikh, N. Sheth, W. Tu, C. Wang, J. B. Ware, B. Wiestler, A. Zapaishchykova, M. Bornhorst, M. Deutsch, M. Fouladi, M. Lazow, L. Mikael, T. Hummel, B. Kann, P. de Blank, L. Hoffman, M. Aboian, A. Nabavizadeh, R. Packer, S. Bakas, A. Resnick, B. Rood, A. Vossough, M. G. Linguraru, "The Brain Tumor Segmentation in Pediatrics (BraTS-PEDs) Challenge: Focus on Pediatrics (CBTN-CONNECT-DIPGR-ASNR-MICCAI BraTS-PEDs)", arXiv:2404.15009, [https://doi.org/10.48550/arXiv.2404.15009](https://doi.org/10.48550/arXiv.2404.15009).
