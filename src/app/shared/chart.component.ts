import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

/** Thin Chart.js wrapper — feeds a full configuration via input signal. */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div class="chart-box"><canvas #canvas></canvas></div>`,
})
export class ChartComponent implements AfterViewInit {
  readonly config = input.required<ChartConfiguration | null>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor(destroyRef: DestroyRef) {
    // Config changes after the chart exists → update in place.
    effect(() => {
      const cfg = this.config();
      if (!this.chart) return;
      if (cfg) {
        this.chart.data = cfg.data;
        if (cfg.options) this.chart.options = cfg.options;
        this.chart.update();
      } else {
        this.chart.destroy();
        this.chart = null;
      }
    });
    destroyRef.onDestroy(() => {
      this.chart?.destroy();
      this.chart = null;
    });
  }

  ngAfterViewInit(): void {
    const cfg = this.config();
    if (cfg) {
      this.chart = new Chart(this.canvas().nativeElement, cfg);
    }
  }
}
