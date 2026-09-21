import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { validate } from 'bitcoin-address-validation';

import { LocalStore } from './core/state/local.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(LocalStore);
  private readonly router = inject(Router);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly searchInvalid = signal(false);
  protected readonly themeIcon = computed(() =>
    this.store.theme() === 'dark' ? 'light_mode' : 'dark_mode',
  );

  constructor() {
    this.store.applyTheme();
    this.search.valueChanges.subscribe(() => this.searchInvalid.set(false));
  }

  protected toggleTheme(): void {
    this.store.setTheme(this.store.theme() === 'dark' ? 'light' : 'dark');
  }

  protected go(): void {
    const address = this.search.value.trim();
    if (!address) return;
    try {
      if (!validate(address)) {
        this.searchInvalid.set(true);
        return;
      }
    } catch {
      this.searchInvalid.set(true);
      return;
    }
    this.searchInvalid.set(false);
    this.store.rememberAddress(address);
    this.search.setValue('');
    this.router.navigate(['/address', address]);
  }
}
