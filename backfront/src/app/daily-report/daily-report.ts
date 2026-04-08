import { Component, Input } from '@angular/core';
import { DailyReportSummaryModel } from '../services/hospitalisation.service';

@Component({
  selector: 'app-daily-report',
  standalone: false,
  templateUrl: './daily-report.html',
  styleUrls: ['./daily-report.css'],
})
export class DailyReportComponent {
  @Input() reports: DailyReportSummaryModel[] = [];
  @Input() hospitalisationId!: number;

  get hasReports(): boolean {
    return !!this.reports && this.reports.length > 0;
  }
}

