import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jsPDF } from 'jspdf';
import { MenuJournalierDTO } from '../services/nutrition.service';

interface JourAvecMenu {
  jour: string;
  jeurFrancais: string;
  menu: MenuJournalierDTO | null;
  caloriesMax: number;
}

@Component({
  selector: 'app-weekly-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-menu.component.html',
  styleUrls: ['./weekly-menu.component.css'],
})
export class WeeklyMenuComponent implements OnInit, OnChanges {
  @Input() menus: Record<string, MenuJournalierDTO[]> = {};
  @Input() menuChoisi: Record<string, number> = {};
  @Input() caloriesJour = 2000;
  @Input() joursList: string[] = [];
  @Output() menuChoisiChange = new EventEmitter<{ jour: string; index: number }>();
  @Output() regenerate = new EventEmitter<void>();

  activeJour = '';
  jours: JourAvecMenu[] = [];
  checkedAliments: Set<string> = new Set();
  completedMenus: Set<string> = new Set();

  readonly repasIcons: Record<string, string> = {
    PETIT_DEJEUNER: '☀️',
    DEJEUNER: '🍽️',
    DINER: '🌙',
    COLLATION: '🍎',
  };
  readonly repasLabels: Record<string, string> = {
    PETIT_DEJEUNER: 'Petit-déjeuner',
    DEJEUNER: 'Déjeuner',
    DINER: 'Dîner',
    COLLATION: 'Collation',
  };

  readonly joursFrancais: Record<string, string> = {
    LUNDI: 'Lundi',
    MARDI: 'Mardi',
    MERCREDI: 'Mercredi',
    JEUDI: 'Jeudi',
    VENDREDI: 'Vendredi',
    SAMEDI: 'Samedi',
    DIMANCHE: 'Dimanche',
    Lundi: 'Lundi',
    Mardi: 'Mardi',
    Mercredi: 'Mercredi',
    Jeudi: 'Jeudi',
    Vendredi: 'Vendredi',
    Samedi: 'Samedi',
    Dimanche: 'Dimanche',
  };

  ngOnInit(): void {
    this.initializeWeek();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['joursList'] && this.joursList?.length) {
      this.activeJour = this.joursList[0];
    }
    if (changes['menus'] || changes['menuChoisi'] || changes['joursList'] || changes['caloriesJour']) {
      this.initializeWeek();
    }
  }

  initializeWeek(): void {
    if (!this.activeJour && this.joursList?.length) {
      this.activeJour = this.joursList[0];
    }
    this.jours = (this.joursList ?? []).map((jour) => ({
      jour,
      jeurFrancais: this.joursFrancais[jour] || jour,
      menu: this.getSelectedMenu(jour),
      caloriesMax: this.caloriesJour,
    }));
  }

  selectDay(jour: string): void {
    this.activeJour = jour;
    this.initializeWeek();
  }

  regenerateWeek(): void {
    this.regenerate.emit();
  }

  get activeMenus(): MenuJournalierDTO[] {
    return this.getMenuOptions(this.activeJour);
  }

  toggleAliment(jour: string, repasType: string, nom: string): void {
    const key = `${jour}|${repasType}|${nom}`;
    this.checkedAliments.has(key)
      ? this.checkedAliments.delete(key)
      : this.checkedAliments.add(key);
  }

  chooseMenu(jour: string, index: number): void {
    this.menuChoisi = { ...this.menuChoisi, [jour]: index };
    this.completedMenus.add(jour);
    this.initializeWeek();
    this.menuChoisiChange.emit({ jour, index });
  }

  getSelectedMenu(jour: string): MenuJournalierDTO | null {
    const index = this.menuChoisi?.[jour];
    return index !== undefined ? this.menus?.[jour]?.[index] || null : null;
  }

  getMenuOptions(jour: string): MenuJournalierDTO[] {
    return this.menus?.[jour] ?? [];
  }
  isAlimentChecked(jour: string, repasType: string, nom: string): boolean {
    return this.checkedAliments.has(`${jour}|${repasType}|${nom}`);
  }

  toggleMenuComplete(jour: string): void {
    this.completedMenus.has(jour)
      ? this.completedMenus.delete(jour)
      : this.completedMenus.add(jour);
  }
  isMenuComplete(jour: string): boolean {
    return this.completedMenus.has(jour) || this.menuChoisi?.[jour] !== undefined;
  }

  isMenuSelected(jour: string, idx: number): boolean {
    return this.menuChoisi?.[jour] === idx;
  }

  getCompletionPercentage(): number {
    return this.jours.length > 0
      ? Math.round((this.completedMenus.size / this.jours.length) * 100)
      : 0;
  }

  getRepasIcon(type: string): string {
    return this.repasIcons[type] || '🍴';
  }
  getRepasLabel(type: string): string {
    return this.repasLabels[type] || type;
  }

  exportToPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 12;
    const colW = pageW - margin * 2;

    type RGB = [number, number, number];
    const INDIGO: RGB = [79, 70, 229];
    const INDIGO_L: RGB = [238, 242, 255];
    const SLATE: RGB = [71, 85, 105];
    const SLATE_L: RGB = [248, 250, 252];
    const GREEN: RGB = [34, 197, 94];
    const ORANGE: RGB = [249, 115, 22];
    const PURPLE: RGB = [147, 51, 234];
    const BLUE: RGB = [59, 130, 246];
    const PINK: RGB = [236, 72, 153];
    const DARK: RGB = [15, 23, 42];
    const BORDER: RGB = [226, 232, 240];
    const WHITE: RGB = [255, 255, 255];

    const repasColors: Record<string, RGB> = {
      PETIT_DEJEUNER: [251, 146, 60],
      DEJEUNER: [99, 102, 241],
      DINER: [139, 92, 246],
      COLLATION: [34, 197, 94],
    };
    const repasLabelMap: Record<string, string> = {
      PETIT_DEJEUNER: 'Petit-dejeuner',
      DEJEUNER: 'Dejeuner',
      DINER: 'Diner',
      COLLATION: 'Collation',
    };

    const sf = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
    const sd = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
    const st = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
    const fillRect = (x: number, y: number, w: number, h: number) => {
      doc.rect(x, y, w, h, 'F');
    };
    const strokeRect = (x: number, y: number, w: number, h: number) => {
      doc.rect(x, y, w, h, 'S');
    };
    const rr = (x: number, y: number, w: number, h: number, r: number, style = 'F') => {
      doc.roundedRect(x, y, w, h, r, r, style as any);
    };
    const ln = (x1: number, y1: number, x2: number, y2: number) => doc.line(x1, y1, x2, y2);

    // PAGE 1 — Couverture
    sf(INDIGO);
    fillRect(0, 0, pageW, 70);
    st(WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.text('Meal Planner', pageW / 2, 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    st([199, 210, 254]);
    doc.text('Plan nutritionnel post-transplantation', pageW / 2, 44, { align: 'center' });
    doc.setFontSize(9);
    st([165, 180, 252]);
    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Genere le ${today}`, pageW / 2, 56, { align: 'center' });

    let y = 82;
    st(DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Apercu de la semaine', margin, y);
    y += 7;

    const joursAvecMenu = this.jours.filter((j) => j.menu).length;
    const cardW = (colW - 6) / 4;
    const cards = [
      { label: 'Jours planifies', val: `${joursAvecMenu}/7`, color: INDIGO },
      { label: 'Kcal/jour cible', val: `${this.caloriesJour}`, color: ORANGE },
      { label: 'Repas total', val: `${joursAvecMenu * 3}`, color: GREEN },
      { label: 'Aliments/jour', val: '~9', color: PURPLE },
    ];
    cards.forEach((c, i) => {
      const cx = margin + i * (cardW + 2);
      sf(c.color);
      rr(cx, y, cardW, 20, 3);
      st(WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(c.val, cx + cardW / 2, y + 10, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(c.label, cx + cardW / 2, y + 17, { align: 'center' });
    });
    y += 28;

    sd(BORDER);
    doc.setLineWidth(0.3);
    ln(margin, y, pageW - margin, y);
    y += 7;

    st(SLATE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Recapitulatif par jour', margin, y);
    y += 5;

    const tCols = [30, 38, 20, 20, 20, 20, 20, 18];
    const tHdrs = ['Jour', 'Calories', 'K+ mg', 'Na mg', 'P mg', 'Prot g', 'Sucre g', 'Statut'];
    sf(INDIGO);
    fillRect(margin, y, colW, 7);
    st(WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    let tx = margin + 2;
    tHdrs.forEach((h, i) => {
      doc.text(h, tx, y + 5);
      tx += tCols[i];
    });
    y += 7;

    this.jours.forEach((jour, idx) => {
      const bg: RGB = idx % 2 === 0 ? WHITE : SLATE_L;
      sf(bg);
      fillRect(margin, y, colW, 7);
      sd(BORDER);
      doc.setLineWidth(0.1);
      strokeRect(margin, y, colW, 7);
      const m = jour.menu as any;
      const vals = [
        jour.jeurFrancais,
        m ? `${Math.round(m.totalCalories ?? 0)}/${jour.caloriesMax}` : '--',
        m ? `${Math.round(m.totalPotassium ?? 0)}` : '--',
        m ? `${Math.round(m.totalSodium ?? 0)}` : '--',
        m ? `${Math.round(m.totalPhosphore ?? 0)}` : '--',
        m ? `${Math.round(m.totalProteines ?? 0)}` : '--',
        m ? `${Math.round(m.totalSucre ?? 0)}` : '--',
        m ? 'OK' : 'Non choisi',
      ];
      tx = margin + 2;
      vals.forEach((v, i) => {
        st(i === 7 ? (m ? GREEN : ([156, 163, 175] as RGB)) : i === 0 ? DARK : SLATE);
        doc.setFont('helvetica', i === 0 || i === 7 ? 'bold' : 'normal');
        doc.setFontSize(7.5);
        doc.text(v, tx, y + 5);
        tx += tCols[i];
      });
      y += 7;
    });

    y += 5;
    st([148, 163, 184]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text(
      'Les pages suivantes detaillent chaque jour avec les portions et valeurs nutritionnelles.',
      margin,
      y
    );

    // 1 page par jour
    this.jours
      .filter((j) => j.menu)
      .forEach((jour) => {
        doc.addPage();
        y = 0;

        sf(INDIGO);
        fillRect(0, 0, pageW, 20);
        st(WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(jour.jeurFrancais, margin, 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        st([199, 210, 254]);
        doc.text('Plan nutritionnel personnalise', margin, 18);
        y = 27;

        const m = jour.menu as any;

        const ncW = (colW - 4) / 5;
        const nutriCards = [
          { label: 'Calories', val: `${Math.round(m.totalCalories ?? 0)}`, unit: `/ ${jour.caloriesMax} kcal`, color: ORANGE },
          { label: 'Proteines', val: `${Math.round(m.totalProteines ?? 0)}`, unit: 'g', color: GREEN },
          { label: 'Potassium', val: `${Math.round(m.totalPotassium ?? 0)}`, unit: 'mg', color: BLUE },
          { label: 'Sodium', val: `${Math.round(m.totalSodium ?? 0)}`, unit: 'mg', color: PURPLE },
          { label: 'Phosphore', val: `${Math.round(m.totalPhosphore ?? 0)}`, unit: 'mg', color: PINK },
        ];
        nutriCards.forEach((nc, i) => {
          const nx = margin + i * (ncW + 1);
          sf(nc.color);
          fillRect(nx, y, ncW, 1.5);
          sf(WHITE);
          fillRect(nx, y + 1.5, ncW, 16);
          sd(BORDER);
          doc.setLineWidth(0.2);
          strokeRect(nx, y + 1.5, ncW, 16);
          st(DARK);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(nc.val, nx + ncW / 2, y + 10, { align: 'center' });
          st(SLATE);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text(nc.unit, nx + ncW / 2, y + 14, { align: 'center' });
          doc.text(nc.label, nx + ncW / 2, y + 17, { align: 'center' });
        });
        y += 22;

        const pct = Math.min(100, (Number(m.totalCalories ?? 0) / jour.caloriesMax) * 100);
        const barClr: RGB = pct > 100 ? [239, 68, 68] : pct > 85 ? [234, 179, 8] : GREEN;
        sf([241, 245, 249]);
        rr(margin, y, colW, 4, 2);
        sf(barClr);
        rr(margin, y, Math.max(2, (colW * pct) / 100), 4, 2);
        st(SLATE);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${Math.round(pct)}% du quota calorique journalier`, margin, y + 9);
        y += 13;

        (m.repas ?? []).forEach((repas: any) => {
          const rType = String(repas?.type ?? '');
          const rClr = repasColors[rType] || INDIGO;
          const rLabel = repasLabelMap[rType] || rType;

          if (y > pageH - 60) {
            doc.addPage();
            sf(INDIGO);
            fillRect(0, 0, pageW, 12);
            st(WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${jour.jeurFrancais} (suite)`, margin, 8.5);
            y = 18;
          }

          sf(rClr);
          rr(margin, y, colW, 8, 2);
          st(WHITE);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(rLabel, margin + 4, y + 5.8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`${Math.round(Number(repas?.totalCalories ?? 0))} kcal`, pageW - margin - 2, y + 5.8, {
            align: 'right',
          });
          y += 8;

          sf(INDIGO_L);
          fillRect(margin, y, colW, 6);
          const rNutri = [
            `Prot: ${Math.round(Number(repas?.totalProteines ?? 0))}g`,
            `K+: ${Math.round(Number(repas?.totalPotassium ?? 0))}mg`,
            `Na: ${Math.round(Number(repas?.totalSodium ?? 0))}mg`,
            `P: ${Math.round(Number(repas?.totalPhosphore ?? 0))}mg`,
          ];
          st(INDIGO);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          const ns = colW / 4;
          rNutri.forEach((n, ni) => doc.text(n, margin + ni * ns + 3, y + 4.2));
          y += 6;

          const cW = [8, 48, 20, 24, 18, 18, 18, 18];
          const cH = ['', 'Aliment', 'Portion', 'Calories', 'Prot.g', 'K+ mg', 'Na mg', 'P mg'];
          const drawColHeader = (yPos: number) => {
            sf([226, 232, 240]);
            fillRect(margin, yPos, colW, 6);
            st(SLATE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            let cx2 = margin;
            cH.forEach((h, hi) => {
              if (hi === 0) doc.text('V', cx2 + 2, yPos + 4.3);
              else if (hi <= 1) doc.text(h, cx2 + 1, yPos + 4.3);
              else doc.text(h, cx2 + cW[hi] - 1, yPos + 4.3, { align: 'right' });
              cx2 += cW[hi];
            });
          };

          drawColHeader(y);
          y += 6;

          const aliments: any[] = Array.isArray(repas?.aliments) ? repas.aliments : [];
          aliments.forEach((a: any, ai: number) => {
            const rowH = 8;
            if (y + rowH > pageH - 15) {
              doc.addPage();
              sf(INDIGO);
              fillRect(0, 0, pageW, 12);
              st(WHITE);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text(`${jour.jeurFrancais} - ${rLabel} (suite)`, margin, 8.5);
              y = 18;
              drawColHeader(y);
              y += 6;
            }

            const rowBg: RGB = ai % 2 === 0 ? WHITE : [248, 250, 252];
            sf(rowBg);
            fillRect(margin, y, colW, rowH);
            sd(BORDER);
            doc.setLineWidth(0.12);
            ln(margin, y + rowH, margin + colW, y + rowH);

            let cx = margin;
            sd([148, 163, 184]);
            doc.setLineWidth(0.5);
            doc.rect(cx + 1.5, y + 1.8, 4.5, 4.5, 'S');
            cx += cW[0];

            st(DARK);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(String(a?.nom ?? ''), cx + 1, y + 5.5);
            cx += cW[1];

            sf(rClr);
            rr(cx, y + 1.5, cW[2] - 1, 5, 1.5);
            st(WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(`${Math.round(Number(a?.portionG ?? 0))}g`, cx + cW[2] / 2, y + 5.5, { align: 'center' });
            cx += cW[2];

            st(ORANGE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text(`${Math.round(Number(a?.calories ?? 0))} kcal`, cx + cW[3] - 1, y + 5.5, { align: 'right' });
            cx += cW[3];

            st(SLATE);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            const nutriVals = [
              `${Number(a?.proteines ?? 0).toFixed(1)}g`,
              `${Math.round(Number(a?.potassium ?? 0))}mg`,
              `${Math.round(Number(a?.sodium ?? 0))}mg`,
              `${Math.round(Number(a?.phosphore ?? 0))}mg`,
            ];
            [cW[4], cW[5], cW[6], cW[7]].forEach((w, ni) => {
              doc.text(nutriVals[ni], cx + w - 1, y + 5.5, { align: 'right' });
              cx += w;
            });

            y += rowH;
          });

          y += 5;
        });

        sd([226, 232, 240]);
        doc.setLineWidth(0.3);
        ln(margin, pageH - 12, pageW - margin, pageH - 12);
        st([148, 163, 184]);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.text('Plan nutritionnel — Usage personnel', margin, pageH - 7);
        doc.text(jour.jeurFrancais, pageW - margin, pageH - 7, { align: 'right' });
      });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      st([148, 163, 184]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`${i} / ${totalPages}`, pageW / 2, pageH - 7, { align: 'center' });
    }

    doc.save(`meal-planner-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  printWeeklyMenu(): void {
    this.exportToPDF();
  }
}

