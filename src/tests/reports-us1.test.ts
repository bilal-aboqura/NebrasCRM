import { describe, expect, it } from "vitest";
import { calculateConversionLossReport, calculatePipelineReport, scopeReportDataset, type ReportDataset } from "@/lib/actions/reports-actions";

const filter = { startDate: "2026-06-01", endDate: "2026-06-30" };
function fixture(): ReportDataset { return {
  facilities: [
    { id:"a1",companyId:"a",name:"A",type:"hospital",city:"Riyadh",region:"Central",primaryPhone:"1",ownerId:"sales-a",status:"contract",isArchived:false,lostReason:undefined,createdAt:"2026-06-01T09:00:00Z",updatedAt:"2026-06-10T09:00:00Z" },
    { id:"a2",companyId:"a",name:"Lost",type:"clinic",city:"Riyadh",region:"Central",primaryPhone:"2",ownerId:"sales-other",status:"lost",lostReason:"السعر",isArchived:false,createdAt:"2026-06-02T09:00:00Z",updatedAt:"2026-06-10T09:00:00Z" },
    { id:"b1",companyId:"b",name:"B",type:"hospital",city:"Jeddah",region:"West",primaryPhone:"3",ownerId:"sales-b",status:"contract",isArchived:false,createdAt:"2026-06-01T09:00:00Z",updatedAt:"2026-06-10T09:00:00Z" }
  ],
  activities: [
    {id:"x1",companyId:"a",facilityId:"a1",kind:"status_change",eventType:"status_change",oldValue:"new",newValue:"contacted",message:"",createdAt:"2026-06-03T09:00:00Z"},
    {id:"x2",companyId:"a",facilityId:"a1",kind:"status_change",eventType:"status_change",oldValue:"contacted",newValue:"contract",message:"",createdAt:"2026-06-08T09:00:00Z"},
    {id:"x3",companyId:"a",facilityId:"a2",kind:"status_change",eventType:"status_change",oldValue:"new",newValue:"lost",message:"",createdAt:"2026-06-09T09:00:00Z"}
  ], followUps:[],callLogs:[],offers:[],contracts:[{id:"c1",companyId:"a",facilityId:"a1",ownerId:"sales-a",referenceNumber:"1",status:"active",value:100,startDate:"2026-06-08",isActive:true}],profiles:[] } }

describe("reports US1", () => {
  it("calculates stage movement and duration", () => { const data=fixture(); const report=calculatePipelineReport(data,filter); expect(report.stages.find(r=>r.stage==="تم التواصل")).toMatchObject({inflow:1,outflow:1,avgDuration:5}) });
  it("calculates funnel, loss reasons, and win rate", () => { const report=calculateConversionLossReport(fixture(),filter); expect(report.lossReasons).toEqual([{reason:"السعر",count:1}]); expect(report.winRate).toBe(50) });
  it("isolates company and sales owner before calculations", () => { const company=scopeReportDataset(fixture(),"a","sales-a",true,filter); expect(company.facilities.map(f=>f.id)).toEqual(["a1","a2"]); const sales=scopeReportDataset(fixture(),"a","sales-a",false,filter); expect(sales.facilities.map(f=>f.id)).toEqual(["a1"]); expect(sales.contracts).toHaveLength(1) });
});
