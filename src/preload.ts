import { validateChart, type Chart } from "./core";
export async function preload(onProgress: (n: number) => void) {
  let completed = 0;
  const finish = () => onProgress((++completed / 4) * 100);
  const loadImage = async (url: string) => {
    const im = new Image();
    im.src = url;
    await im.decode();
    finish();
    return im;
  };
  const [dog, loading, cry, chart] = await Promise.all([
    loadImage("/assets/dog.png"),
    loadImage("/assets/loading.png"),
    loadImage("/assets/dog-cry.png"),
    fetch("/chart.json")
      .then((r) => {
        if (!r.ok) throw Error("차트 로드 실패");
        return r.json();
      })
      .then((c: Chart) => {
        validateChart(c);
        finish();
        return c;
      }),
  ]);
  return { dog, loading, cry, chart };
}
