import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, MonacoEditorModule, FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useValue: {
        baseUrl: 'assets/monaco-editor/min/vs', // path in angular.json assets
        defaultOptions: { scrollBeyondLastLine: false },
      },
    }
  ]
})
export class EditorComponent {
  @Input() code: string = '';
  @Output() codeChange = new EventEmitter<string>();

  editorOptions = signal({
    theme: 'vs-dark',
    language: 'json',
    automaticLayout: true,
  });


}
