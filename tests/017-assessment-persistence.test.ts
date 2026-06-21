import { expect, test, describe, beforeEach } from 'vitest';
import { saveAssessment, getFacilityAssessments, archiveAssessment, recoverAssessment } from '@/lib/actions/assessment-actions';
import { db, nowIso } from '@/lib/data/store';
import { ReadinessTier } from '@/lib/types/assessment';

describe('Assessment Persistence Server Actions', () => {
  beforeEach(() => {
    // Reset mock data
    db.assessments.length = 0;
  });

  test('should calculate correct score and tier', async () => {
    const result = await saveAssessment({
      facilityId: 'fac-1',
      facilityTypeAssessed: 'general',
      answers: [
        { item_code: 'A1', status: 'Met' },
        { item_code: 'A2', status: 'Met' },
        { item_code: 'A3', status: 'Not Met' },
        { item_code: 'A4', status: 'Not Applicable' }
      ]
    }, {
      userId: 'u-sales-a',
      companyId: 'company-a',
      role: 'sales_user'
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    // 2 Met out of 3 applicable = 66%
    expect(result.assessment?.overallScore).toBe(67);
    expect(result.assessment?.readinessTier).toBe('medium');
    
    // Check timeline entry
    const activity = db.activities.find(a => a.facilityId === 'fac-1' && a.kind === 'assessment_saved');
    expect(activity).toBeDefined();
  });

  test('should enforce tenant isolation', async () => {
    const result = await saveAssessment({
      facilityId: 'fac-3', // fac-3 belongs to company-b
      facilityTypeAssessed: 'general',
      answers: []
    }, {
      userId: 'u-sales-a',
      companyId: 'company-a',
      role: 'sales_user'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized: You do not have permission to assess this facility.');
  });

  test('should retrieve history and calculate progression delta', async () => {
    // Add two past assessments for fac-1 manually to db
    db.assessments.push({
      id: 'asm-old',
      companyId: 'company-a',
      facilityId: 'fac-1',
      assessedBy: 'u-sales-a',
      facilityTypeAssessed: 'general',
      overallScore: 45,
      readinessTier: 'low',
      answers: [],
      isActive: true,
      archivedAt: null,
      archivedBy: null,
      createdAt: '2026-01-01T00:00:00.000Z'
    });

    db.assessments.push({
      id: 'asm-new',
      companyId: 'company-a',
      facilityId: 'fac-1',
      assessedBy: 'u-sales-a',
      facilityTypeAssessed: 'general',
      overallScore: 78,
      readinessTier: 'medium',
      answers: [],
      isActive: true,
      archivedAt: null,
      archivedBy: null,
      createdAt: '2026-06-01T00:00:00.000Z'
    });

    const result = await getFacilityAssessments('fac-1', {
      userId: 'u-sales-a',
      companyId: 'company-a',
      role: 'sales_user'
    });

    expect(result.length).toBe(2);
    // Newest first
    expect(result[0].id).toBe('asm-new');
    expect(result[1].id).toBe('asm-old');

    // Progression should be relative to older assessments
    // asm-new compared to asm-old (45) -> delta is +33
    expect((result[0] as any).previousScore).toBe(45);
    expect((result[0] as any).delta).toBe(33);
    
    // asm-old has no previous score
    expect((result[1] as any).previousScore).toBeUndefined();
    expect((result[1] as any).delta).toBeUndefined();
  });

  test('should allow supervisors to archive and recover assessments', async () => {
    db.assessments.push({
      id: 'asm-to-archive',
      companyId: 'company-a',
      facilityId: 'fac-1',
      assessedBy: 'u-sales-a',
      facilityTypeAssessed: 'general',
      overallScore: 80,
      readinessTier: 'high',
      answers: [],
      isActive: true,
      archivedAt: null,
      archivedBy: null,
      createdAt: '2026-06-01T00:00:00.000Z'
    });

    // Attempt to archive as sales_user
    const salesResult = await archiveAssessment('asm-to-archive', {
      userId: 'u-sales-a',
      companyId: 'company-a',
      role: 'sales_user'
    });
    expect(salesResult.success).toBe(false);

    // Attempt to archive as supervisor
    const superResult = await archiveAssessment('asm-to-archive', {
      userId: 'u-supervisor-a',
      companyId: 'company-a',
      role: 'supervisor'
    });
    expect(superResult.success).toBe(true);
    expect(db.assessments.find(a => a.id === 'asm-to-archive')?.isActive).toBe(false);

    // Recover as supervisor
    const recResult = await recoverAssessment('asm-to-archive', {
      userId: 'u-supervisor-a',
      companyId: 'company-a',
      role: 'supervisor'
    });
    expect(recResult.success).toBe(true);
    expect(db.assessments.find(a => a.id === 'asm-to-archive')?.isActive).toBe(true);
  });
});
