var App = function() {

  var self = this
  
  this.tinyDom;  
  
  this.init = function() {
    $('.bookmark_link').click(function(){
      var hashtag = $(this).text()
      $('#filter_box').val(hashtag)  
      $('#filter_box').trigger("input")  
    })  
    
    $('#container').on('click', '.file_link', function(){
      var fileId = $(this).data('id');
      app.loadNotes(fileId);
    })

    $('#container').on('click', '.filter_clear', function(){
      $('#filter_box').val("")
      app.filter()
    })

    $('#container').on('click', '.filter_link', function(){
      var hashtag =  '#'+$(this).data('name')
      $('#filter_box').val(hashtag)  
      $('#filter_box').trigger("input") 
    })

    $(this.tinyDom).on('click', '.hash_link', function(){
      var hashtag =  '#'+$(this).data('name')
      $('#filter_box').val(hashtag)  
      $('#filter_box').trigger("input") 
    })

    tinymce.init({
      selector: '#editor',
      height: '600px',
      statusbar: false,
      menubar:false,
      content_css : 'simplex.bootstrap.min.css, style.css',    
      plugins: [
        'autolink lists link save'
      ],
      save_enablewhendirty: true,
      save_onsavecallback: function () { app.parseHashtags(); app.applyStyles(); app.saveNotes(); },
      toolbar: 'bullist save removeformat',
      setup : function(ed){
        ed.on('init', function() {
          this.getDoc().body.style.fontSize = '14px';
          app.tinyDom = tinyMCE.activeEditor.dom.getRoot()
        });
    
      }
    });
  }

  this.filter = function() {
    var current_text = $('#filter_box').val()
    var hashtags = current_text.replace(/  +/g, ' ').split(' ')
    hashtags = hashtags.filter(function(h){ return h != "" }); 
    $(this.tinyDom).find('li').hide()
    $(this.tinyDom).find('li').each(function() {
      var li_text = $(this).clone().children('ul').remove().end().html();
      //filter using OR
      if (new RegExp(hashtags.join("|")).test(li_text)) {
        $(this).show()
        $(this).parents().show()
        $(this).find('li').show()
      } 
    })
  }
  
  this.parseHashtags = function() {
    var initText = $(this.tinyDom).html()
    var parsedText = initText.replace( /#(\w+)\b(?!<\/a>)/g ,'<a class="hash_link" data-name="$1" href="#">#$1</a>')
    parsedText = this.parseSmartTags(parsedText);
    $(this.tinyDom).html(parsedText);
    this.extractHashtags();
    console.log('parsedhashtags')
  }
  
  this.parseSmartTags = function(initText) {
    return initText.replace(/\$(\w+)\b(?!<\/a>)/g, function (match, smartTag) {
      var newLink = $("<a />", {
          href : "#",
          class : 'smartTag',
          'data-name': smartTag,
          text : '$'+smartTag
      })
      
      if (smartTag == 'todo') {
        newLink.addClass('todo bg-warning')
          console.log('todo tag')
      } else if (smartTag == 'completed') { 
        newLink.addClass('completed bg-success')
        console.log('journal tag')
      } else if (smartTag == 'journal') { 
        newLink.addClass('journal bg-info')
        console.log('journal tag')        
      } else {
        
      }
      return newLink.prop('outerHTML');      
    });
  }

  this.extractHashtags = function() {
    $('#allTags').html("")
    var tagMap = {}
    $(this.tinyDom).find('.hash_link').each(function(){
      var name = $(this).data('name')
      if (tagMap[name]) {
        tagMap[name] = tagMap[name]+1
      } else {
        tagMap[name] = 1
      }
    })

    $.each(tagMap, function( name, count ) {
      var newLink = $("<a />", {
          'data-name': name,
          href : "#",
          text : '#'+name+"("+count+")",
          class: 'filter_link'
      });

      $('#allTags').append(newLink).append('<br/>')
    });
  } 

  //variable to reference the file id that we are modified, used when updated it
  this.current_file = {
      content: '',
      id:null,
      name: 'sorter_notes'
  };
  
  this.saveNotes = function() {
    this.current_file.content = $(this.tinyDom).html()
    driveService.saveFile(self.current_file, function(file){
      self.current_file = file
      console.log('saved file with id:'+file.id)
    })
  }

  this.loadNotes = function(fileId) {
    var file = {id: fileId }
    window.driveService.loadFile(file, function(file){
      self.current_file = file;
      $(self.tinyDom).html(file.content);
      self.extractHashtags()
    })
  }

  this.notes = []
  this.listNotes = function() {
    window.driveService.listFiles(function(err, files){
      if (err) {
        console.log('List error:'+err)
        return
      }
      $('#fileFinder ol').html("");
      self.notes = []
      $.each(files, function( index, file ) {
        self.notes.push(file)
        var li = $('<li/>')
        var newLink = $("<a />", {
            href : "#",
            class: 'file_link',
            'data-id': file.id,
            'data-name': file.name,
            text: file.name
        }).appendTo(li);
        $('#fileFinder ol').append(li)
      });
      //todo move this to a better place
      if (files.length) {
          self.current_file = files[0]
          self.loadNotes(self.current_file.id)
      }
    })
  }  
  
  this.applyStyles = function() {
    $(this.tinyDom).find('a.smartTag').each(function() {      
      var classes = $(this).prop('class')
      $(this).parent().addClass(classes);
    })    
  }
};


var Util = function() {
  this.formatDate = function(date) {
    return date.split('.')[0].replace('T', ' ').replace(/-/g,'/')
  }  
}
