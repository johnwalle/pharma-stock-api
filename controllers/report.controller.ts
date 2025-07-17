import { Request, Response } from 'express';
import * as reportService from '../services/report.service';

export const getReport = async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || 'Last 30 Days';

    const report = await reportService.getReports(range);
    console.log('Generated report:', report);
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('Error in getReport:', err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};
