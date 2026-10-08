import { Composition, staticFile } from "remotion";
import {
  CaptionedVideo,
  calculateCaptionedVideoMetadata,
  captionedVideoSchema,
} from "./CaptionedVideo";
import { calculateSkipReadStudyMetadata, SkipReadStudy } from "./SkipReadStudy";
import samplePlan from "./SkipReadStudy/sample-plan.json";
import {
  SkipReadStudyProps,
  skipReadStudySchema,
} from "./SkipReadStudy/schema";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Формат SKIP / READ / STUDY. Реальный ролик: npm run reel -- видео.mp4 */}
      <Composition
        id="SkipReadStudy"
        component={SkipReadStudy}
        calculateMetadata={calculateSkipReadStudyMetadata}
        schema={skipReadStudySchema}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={300}
        defaultProps={samplePlan as SkipReadStudyProps}
      />
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        calculateMetadata={calculateCaptionedVideoMetadata}
        schema={captionedVideoSchema}
        width={1080}
        height={1920}
        defaultProps={{
          src: staticFile("sample-video.mp4"),
        }}
      />
    </>
  );
};
