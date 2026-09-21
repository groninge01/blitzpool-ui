import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { App } from './app';

describe('App search', () => {
  function setup() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, navigate, el };
  }

  function submit(el: HTMLElement, value: string) {
    const input = el.querySelector<HTMLInputElement>('form.search input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form.search')!.dispatchEvent(new Event('submit'));
  }

  it('navigates to the address page on submit', () => {
    const { fixture, navigate, el } = setup();
    const address = 'bc1qyqtd6s999ecx20xmhf0wc9q4jhvmpccmwwr4w6';
    submit(el, address);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/address', address]);
  });

  it('shows an error instead of navigating on an invalid address', () => {
    const { fixture, navigate, el } = setup();
    submit(el, 'not-an-address');
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector('.search-error')).toBeTruthy();
  });
});
