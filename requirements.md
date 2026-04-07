# Maxwell Homes & Properties Ltd

## Custom Real Estate CRM - Functional Requirements Checklist

**Date:** 3 Dec 25

## 1. Project Overview

- [ ] Build a custom Real Estate CRM for web
- [ ] Manage leads end-to-end
- [ ] Track salesman activity (Google location) and performance
- [ ] Support follow-ups and customer conversion tracking
- [ ] Manage property inventory
- [ ] Provide convenience/billing tracking
- [ ] Provide dashboards and reports

## 2. User Roles & Permission Levels

### Super Admin (Owner / CEO)

- [ ] Can view all leads
- [ ] Can assign salesman
- [ ] Has dashboard access
- [ ] Can manage property inventory
- [ ] Can view activity log
- [ ] Has access to all segments

### Admin (DGM / AGM)

- [ ] Can view all leads
- [ ] Can assign salesman
- [ ] Has dashboard access
- [ ] Can manage property inventory
- [ ] Can view activity log

### Manager

- [ ] Can view assigned team leads
- [ ] Can monitor follow-ups
- [ ] Has report access

### Salesman

- [ ] Can view only own leads
- [ ] Can add/update own leads
- [ ] Can create follow-ups
- [ ] Can add notes

### Access Note

- [ ] Ensure strict role-based access only

## 3. Lead Management Module

### Lead Fields

- [ ] Lead ID (Auto Serial: RL-0001, RL-0002)
- [ ] Lead Source (Facebook, Website, Phone, Referral, Walk-in)
- [ ] Customer Name
- [ ] Phone Number (with duplicate check)
- [ ] Area / Location
- [ ] Property Type Main (Land / Land Share / Commercial Plot)
- [ ] Property Type Sub (Ready / Ongoing / Installment)
- [ ] Block & Road Number
- [ ] Budget Range
- [ ] Lead Status (Hot, Warm, Cold, Not Interested, Closed)
- [ ] Assigned Salesman
- [ ] Follow-up Date
- [ ] Conversation Notes
- [ ] Image or Document upload
- [ ] Created Date
- [ ] Last Activity Date

### Features

- [ ] Auto serial ID generation
- [ ] Duplicate number warning
- [ ] Lead import (Excel/CSV)
- [ ] Lead filtering (Area, Status, Salesman, Budget)
- [ ] Bulk assign to salesman
- [ ] Lead transfer feature

## 4. Follow-up Management

### Follow-up Fields

- [ ] Follow-up Date & Time
- [ ] Follow-up Type (Call / Visit / Message)
- [ ] Next Follow-up Date
- [ ] Follow-up Notes
- [ ] Status update option

### Automation

- [ ] Missed follow-up -> Auto red highlight
- [ ] Daily follow-up list for each salesman
- [ ] Auto reminder notification

## 5. Property Inventory Module

### Property Fields

- [ ] Property ID
- [ ] Property Title
- [ ] Location
- [ ] Size (Katha/Sqft)
- [ ] Block & Road
- [ ] Face
- [ ] Price
- [ ] Status (Available / Sold / Hold)
- [ ] Documents Uploaded (PDF/Image)
- [ ] Assigned Sales Manager

### Functions

- [ ] Property-wise lead mapping
- [ ] Price history
- [ ] Available unit tracking

## 6. Sales Pipeline (Deal Management)

- [ ] Pipeline stages: Lead -> Prospect -> Visit Done -> Negotiation -> Booking -> Sold
- [ ] Stage changing option
- [ ] Deal closing form
- [ ] Payment record input (not mandatory)

## 7. Task & Activity Log Module

- [ ] Assign tasks to each salesman
- [ ] Weekly target assignment
- [ ] Monthly target assignment
- [ ] Activity history (every update recorded)
- [ ] Track who updated lead and when

## 8. Convenience + Bill

- [ ] Salesman convenience tracking
- [ ] Date-wise view
- [ ] Month-wise view
- [ ] Designation-wise view

## 9. Dashboard & Reports

### Admin Dashboard

- [ ] Total leads
- [ ] Salesman-wise leads
- [ ] Hot/Warm/Cold segmentation
- [ ] Conversion rate
- [ ] Follow-up due today
- [ ] Area-based demand report
- [ ] Monthly sales report

### Salesman Dashboard

- [ ] My leads
- [ ] Today's follow-ups
- [ ] Conversion percentage
- [ ] Monthly performance summary

## 10. Search & Filtering

- [ ] Phone number search
- [ ] Customer name search
- [ ] Budget range filter
- [ ] Location filter
- [ ] Salesman filter
- [ ] Status-based filtering

## 11. Notification System

- [ ] Follow-up reminder
- [ ] New lead assignment notification
- [ ] Status change alert
- [ ] Admin broadcast message

## 12. Data Security & Backup

- [ ] Role-based access control
- [ ] Data encryption
- [ ] Cloud backup (Daily/Weekly)

## 13. Expansion Scope

- [ ] WhatsApp API Integration
- [ ] Facebook Lead Form Auto Sync
- [ ] Customer Portal Login
- [ ] EMI/Payment Tracking Module
