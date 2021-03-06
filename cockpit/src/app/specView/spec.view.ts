import { Component, Input, OnInit } from '@angular/core';
import { read } from 'fs';

@Component({
    selector: 'spec-view',
    templateUrl: './app.specview.html'
})
export class SpecViewComponent implements OnInit {

    @Input() text;
    @Input() readonly: boolean;
    options: any = { maxLines: 1000, printMargin: false };

    ngOnInit() {

    }
}
