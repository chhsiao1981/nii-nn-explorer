import {
  CssBaseline,
  createTheme,
  type PaletteMode,
  TextField,
  ThemeProvider,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import { type NiiVueLocation, Niivue } from "@niivue/niivue";
import { vec3 } from "gl-matrix";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useThunk } from "use-thunk";
import * as DoApp from "../thunks/app";
import { isSkipSaveFileType } from "../thunks/item";
import type {
  Extractor,
  MetaExtractor,
  MetaItem,
  Model,
} from "../thunks/types";
import styles from "./App.module.css";
import { type D3Node, D3NodeType } from "./d3node";
import { d3NodeGetDefaultAssignedNode } from "./d3nodeUtils";
import Header from "./Header";
import useWindowSize from "./hooks/useWindowSize";
import IndexSelect from "./IndexSelect";
import InfoTable from "./InfoTable";
import { metaExtractorToD3Meta } from "./metaToD3Node";
import PrePostSwitch from "./PrePostSwitch";
import { Tree, TreeClean } from "./Tree";
import type { NIIVueImgInfo } from "./types";
import {
  niivueInfoDimsToDisplayDims as dimsSARToDimsRAS,
  getFracFromVox,
  getVoxelValue,
  getVoxFromFrac,
  niivueInfoToBackOpacity,
  niivueInfoToNVImage,
} from "./utils";

const defaultAssignedNode: D3Node = {
  name: "",
  children: [],
  theType: D3NodeType.None,
  extractorID: "",
};

const defaultNiivueName = "(none)";
const defaultRawName = "(meta data)";
const defaultRawContent = "";
const defaultIsDadiologistView = true;
const defaultThemeMode: PaletteMode = "dark";

export default () => {
  const [app, doApp] = useThunk<DoApp.State, typeof DoApp>(DoApp);

  const [model, setModel] = useState<Model | null>(null);
  const [meta, setMeta] = useState<MetaExtractor | null>(null);
  const [metaName, setMetaName] = useState("");
  const [d3Meta, setD3Meta] = useState<D3Node | null>(null);
  const [modelList, setModelList] = useState<Model[]>([]);
  const [metaList, setMetaList] = useState<Extractor[]>([]);

  const [assignedNode, setAssignedNode] = useState<D3Node>(defaultAssignedNode);

  const [niivueRefImgInfo, setNiivueRefImgInfo] = useState<NIIVueImgInfo>(null);

  const [niivueToRefImgInfo, setNiivueToRefImgInfo] =
    useState<NIIVueImgInfo>(null);
  const [niivueFocusedLocation, setNiivueFocusedLocation] = useState<vec3>([
    0, 0, 0,
  ]);
  const [niivueFocusedValue, setNiivueFocusedValue] = useState(0);
  const [niivueName, setNiivueName] = useState(defaultNiivueName);
  const [niivueDims, setNiivueDimsRAS] = useState<number[]>([]);
  // We need to separate niivueSelectedChannels and niivueFocusedLocation
  // because nvOnLocationChange cannot get the updated niivueSelectedChannels.
  const [niivueSelectedChannels, setNiivueSelectedChannels] = useState<
    number[]
  >([]);
  const [theNiivue, setTheNiivue] = useState<Niivue | null>(null);

  const [rawName, setRawName] = useState(defaultRawName);
  const [rawContent, setRawContent] = useState(defaultRawContent);

  const [isRadiologistView, setIsRadiologistView] = useState(
    defaultIsDadiologistView,
  );

  const windowSize = useWindowSize();
  const [windowWidth, windowHeight] = windowSize;

  const [themeMode, setThemeMode] = useState<PaletteMode>(defaultThemeMode);

  const d3ref = useRef<SVGSVGElement>(null);
  const glref = useRef<HTMLCanvasElement>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [isOpenSnackbar, setIsOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  // init.
  // biome-ignore lint/correctness/useExhaustiveDependencies: doApp.init
  useEffect(() => {
    doApp.init();
  }, []);

  // model-list and meta-list updated.
  useEffect(() => {
    if (app.modelList !== modelList) {
      const newModel = app.modelList.length ? app.modelList[0] : null;
      setModel(newModel);
      setModelList(app.modelList);
    }
  }, [app.modelList, modelList]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: doApp.getMeta
  useEffect(() => {
    if (app.metaList !== metaList) {
      setMetaList(app.metaList);
      const newMeta = app.metaList.length ? app.metaList[0] : null;
      if (!newMeta) {
        return;
      }

      setIsBusy(true);
      setMetaName(newMeta.name);
      doApp.getMeta(newMeta.name);
    }
  }, [app.metaList, metaList]);

  // meta updated, clean theNiivue.
  useEffect(() => {
    if (!app.meta) {
      return;
    }

    if (!theNiivue) {
      return;
    }

    if (app.meta === meta) {
      return;
    }

    const d3Meta = metaExtractorToD3Meta(app.meta);

    setD3Meta(d3Meta);
    const defaultNode = d3NodeGetDefaultAssignedNode(d3Meta);
    if (defaultNode) {
      setAssignedNode(defaultNode);
      while (theNiivue.back) {
        theNiivue.setVolume(theNiivue.back, -1);
      }
    }
    setMeta(app.meta);
  }, [app.meta, theNiivue, meta]);

  // update Tree.
  useEffect(() => {
    if (!d3Meta) {
      return;
    }

    if (!d3ref) {
      return;
    }

    if (!d3ref.current) {
      return;
    }

    TreeClean(d3ref as RefObject<SVGSVGElement>);

    Tree(
      d3ref as RefObject<SVGSVGElement>,
      d3Meta,
      windowWidth / 2,
      setAssignedNode,
      windowHeight - 100,
      themeMode,
    );
  }, [d3Meta, windowWidth, windowHeight, themeMode]);

  const nvOnLocationChange = (location: NiiVueLocation) => {
    if (!theNiivue) {
      return;
    }

    const vox = getVoxFromFrac(theNiivue, location.frac);

    const voxelValue = getVoxelValue(theNiivue, vox);

    setNiivueFocusedLocation(vox);
    setNiivueFocusedValue(voxelValue);
  };

  useEffect(() => {
    if (!glref) {
      return;
    }
    if (!glref.current) {
      return;
    }

    const nv = new Niivue();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    nv.attachToCanvas(glref.current);
    setTheNiivue(nv);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nvOnLocationChange
  useEffect(() => {
    if (!theNiivue) {
      return;
    }

    theNiivue.onLocationChange = nvOnLocationChange;
  }, [theNiivue]);

  useEffect(() => {
    if (!theNiivue) {
      return;
    }

    theNiivue.setRadiologicalConvention(isRadiologistView);
  }, [theNiivue, isRadiologistView]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: niivueToRefImgInfo, niivueRefImgInfo
  useEffect(() => {
    // update niivueInfo (after getProtobuf)
    // or refImgInfo (after getProtobuf with new meta)
    if (!glref) {
      return;
    }
    if (!glref.current) {
      return;
    }

    if (!app.niivueInfo) {
      return;
    }

    if (!app.refImgInfo) {
      console.warn("App: setup niivueInfo but not refImgInfo");
      return;
    }

    if (!theNiivue) {
      return;
    }

    setRawName(defaultRawName);
    setRawContent(defaultRawContent);

    const img = niivueInfoToNVImage(app.niivueInfo);

    // XXX hack for geo-identity.
    if (app.niivueInfo.isGeoIdentity) {
      setNiivueToRefImgInfo({
        img: niivueRefImgInfo.img,
        info: niivueRefImgInfo.info,
      });
      while (theNiivue.back) {
        theNiivue.setVolume(theNiivue.back, -1);
      }
      setNiivueRefImgInfo(null);
    } else if (niivueToRefImgInfo !== null) {
      while (theNiivue.back) {
        theNiivue.setVolume(theNiivue.back, -1);
      }
      theNiivue.addVolume(niivueToRefImgInfo.img);
      setNiivueRefImgInfo({
        img: niivueToRefImgInfo.img,
        info: niivueToRefImgInfo.info,
      });
      setNiivueToRefImgInfo(null);
    }

    // XXX remove other overlays for now for simplicity.
    if (theNiivue.overlays.length) {
      theNiivue.setVolume(theNiivue.overlays[0], -1);
    }

    setNiivueName(app.niivueInfo.name);

    const origBack = theNiivue.back;
    theNiivue.addVolume(img);

    if (origBack) {
      origBack.opacity = niivueInfoToBackOpacity(app.niivueInfo);
      theNiivue.setVolume(img, 1);
    } else {
      setNiivueRefImgInfo({ img: img, info: app.niivueInfo });
      theNiivue.setVolume(img, 0);
    }

    const theDimsRAS = app.niivueInfo.dimsSAR
      .slice(app.niivueInfo.dimsSAR.length - 3)
      .reverse();

    const locationValuesRAS = theDimsRAS.map((each) => [
      Number.parseInt(each / 2, 10),
    ]);
    const locationRAS = vec3.fromValues(
      locationValuesRAS[0],
      locationValuesRAS[1],
      locationValuesRAS[2],
    );
    const frac = getFracFromVox(theNiivue, locationRAS);
    theNiivue.scene.crosshairPos = frac;

    const voxelValue = getVoxelValue(theNiivue, locationRAS);
    setNiivueFocusedLocation(locationRAS);
    setNiivueFocusedValue(voxelValue);
    const niivueDimsRAS = dimsSARToDimsRAS(app.niivueInfo.dimsSAR);
    setNiivueDimsRAS(niivueDimsRAS);

    const nSelectChannels =
      niivueDimsRAS.length < 3 ? 0 : niivueDimsRAS.length - 3;
    setNiivueSelectedChannels(
      Array.from({ length: nSelectChannels }).map(() => 0),
    );

    theNiivue.drawScene();
    theNiivue.createOnLocationChange();

    setIsBusy(false);
  }, [theNiivue, app.niivueInfo, app.refImgInfo]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: doApp.getProtobuf
  useEffect(() => {
    if (!assignedNode) {
      return;
    }
    if (!assignedNode.extractorID) {
      return;
    }

    if (assignedNode.protobufInfo) {
      setIsBusy(true);
      doApp.getProtobuf(assignedNode.name, assignedNode.protobufInfo);
    }

    if (assignedNode.theType === D3NodeType.MetaItem) {
      const meta: MetaItem = assignedNode.item;
      if (isSkipSaveFileType(meta.the_type)) {
        // show meta for skip-save-file item
        const meta_display = JSON.stringify(meta.value, null, 2);
        setRawName(meta.name);
        setRawContent(meta_display);
      }
    }
  }, [assignedNode]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: doApp.cleanErrMsg
  useEffect(() => {
    if (!app.errmsg) {
      return;
    }

    setIsBusy(false);
    setSnackbarMsg(app.errmsg);
    setIsOpenSnackbar(true);
    doApp.cleanErrMsg();
  }, [app.errmsg]);

  useEffect(() => {
    if (!theNiivue) {
      return;
    }

    if (!theNiivue.back) {
      return;
    }

    theNiivue.drawScene();
  }, [theNiivue]);

  const changeMeta = (meta: Extractor) => {
    const metaExtractor = meta.meta;
    setIsBusy(true);
    setMetaName(metaExtractor.name);
    doApp.getMeta(rootID, metaExtractor.name);
  };

  // responsive
  const containerStyle = {
    width: windowWidth,
  };

  const svgDivStyle = {
    height: windowHeight - 100,
  };

  const svgStyle = {
    height: windowHeight - 100,
  };

  const glDivHeight = Math.min(windowHeight / 3, windowWidth / 2 / 4);
  const glDivStyle = {
    height: glDivHeight,
  };
  const glStyle = {
    height: glDivStyle.height - 30,
  };
  const textFieldDivStyle = {
    height: glDivStyle.height,
    marginTop: 10,
    marginLeft: 5,
    marginRight: 5,
  };
  const textFieldRows = (glDivStyle.height - 30) / 24;

  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  const setSelectedIndexes = (selectedIndexes: number[]) => {
    if (!theNiivue?.back) {
      return;
    }

    const focusedLocation =
      selectedIndexes.length > 3
        ? selectedIndexes.slice(selectedIndexes.length - 3)
        : selectedIndexes;
    const selectedChannels =
      selectedIndexes.length > 3
        ? selectedIndexes.slice(0, selectedIndexes.length - 3)
        : [];

    // focusedLocation
    if (
      focusedLocation[0] !== niivueFocusedLocation[0] ||
      focusedLocation[1] !== niivueFocusedLocation[1] ||
      focusedLocation[2] !== niivueDims[2]
    ) {
      const focusedLocationVec3 = vec3.fromValues(
        focusedLocation[0],
        focusedLocation[1],
        focusedLocation[2],
      );
      const focusedValue = getVoxelValue(theNiivue, focusedLocationVec3);
      const frac = getFracFromVox(theNiivue, focusedLocationVec3);
      setNiivueFocusedLocation(focusedLocationVec3);
      setNiivueFocusedValue(focusedValue);
      theNiivue.scene.crosshairPos = frac;
    }

    // selectedChannels
    const selectDims = niivueDims.slice(0, selectedChannels.length);
    const selectOffsets = selectedChannels.map(() => 0);
    selectOffsets[selectDims.length - 1] = 1;
    for (let idx = selectDims.length - 2; idx >= 0; idx--) {
      selectOffsets[idx] = selectOffsets[idx + 1] * selectDims[idx + 1];
    }
    const selectedOffset = selectedChannels.reduce((r, x, idx) => {
      return r + x * selectOffsets[idx];
    }, 0);

    const theImg = theNiivue.overlays.length
      ? theNiivue.overlays[0]
      : theNiivue.back;

    theImg.calMinMax(selectedOffset);

    theNiivue.setFrame4D(theImg.id, selectedOffset);
    const layer = theNiivue.overlays.length ? 1 : 0;
    theNiivue.setVolume(theImg, layer);

    setNiivueSelectedChannels(selectedChannels);
  };

  const closeSnackbar = () => {
    setSnackbarMsg("");
    setIsOpenSnackbar(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header
        modelList={modelList}
        metaList={metaList}
        changeModel={setModel}
        changeMeta={changeMeta}
        selectedModel={model}
        selectedMetaName={metaName}
        assignedNode={assignedNode}
        initThemeMode={defaultThemeMode}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        isBusy={isBusy}
      />
      <div className={styles.container} style={containerStyle}>
        <div className={styles["svg-div"]} style={svgDivStyle}>
          <svg ref={d3ref} className={styles.svg} style={svgStyle} />
        </div>
        <div className={styles["gl-root"]}>
          <div className={styles["gl-div"]} style={glDivStyle}>
            <div className={styles["gl-label"]}>
              <span>{niivueName}</span>
              <span>
                <span className={styles["channel-dims"]}>
                  ({niivueDims.join(",")})
                </span>
                <IndexSelect
                  dims={niivueDims}
                  focusedLocation={niivueFocusedLocation}
                  selectedChannels={niivueSelectedChannels}
                  setSelectedIndexes={setSelectedIndexes}
                />
                :{` ${niivueFocusedValue.toFixed(3)}`}
              </span>
              <PrePostSwitch
                prefix="neurologist"
                postfix="radiologist"
                setValue={setIsRadiologistView}
              />
            </div>
            <div className={styles.gl} style={glStyle}>
              <canvas ref={glref} />
            </div>
          </div>
          <div className={styles["gl-div"]} style={glDivStyle}>
            <InfoTable theNiivue={theNiivue} vox={niivueFocusedLocation} />
          </div>
          <div style={textFieldDivStyle}>
            <TextField
              label={rawName}
              fullWidth
              multiline
              minRows={textFieldRows}
              maxRows={textFieldRows}
              value={rawContent}
              variant="standard"
            />
          </div>
        </div>
        <Snackbar
          open={isOpenSnackbar}
          autoHideDuration={3000}
          onClose={closeSnackbar}
          message={snackbarMsg}
        />
      </div>
    </ThemeProvider>
  );
};
