import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sidebar-placeholder-page',
  templateUrl: './sidebar-placeholder-page.html',
  styleUrls: ['./sidebar-placeholder-page.css'],
  standalone: false,
})
export class SidebarPlaceholderPage implements OnInit {
  title = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = (this.route.snapshot.data['title'] as string) || 'Page';
  }
}
