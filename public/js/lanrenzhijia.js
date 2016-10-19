/* 代码整理：懒人之家 www.lanrenzhijia.com */
// Generated by CoffeeScript 1.6.3
(function() {
  $(function() {
    var brick;
    brick = "<div class='brick small'><div class='delete'>&times;</div></div>";
    $(document).on("click", ".gridly .brick", function(event) {
      var $this, size;
      event.preventDefault();
      event.stopPropagation();
      $this = $(this);
      $this.toggleClass('small');
      $this.toggleClass('large');
      if ($this.hasClass('small')) {
        size = 140;
      }
      if ($this.hasClass('large')) {
        size = 300;
      }
      $this.data('width', size);
      $this.data('height', size);
      return $('.gridly').gridly('layout');
    });
    $(document).on("click", ".gridly .delete", function(event) {
      var $this;
      event.preventDefault();
      event.stopPropagation();
      $this = $(this);
      $this.closest('.brick').remove();
      return $('.gridly').gridly('layout');
    });
    $(document).on("click", ".add", function(event) {
      event.preventDefault();
      event.stopPropagation();
      $('.gridly').append(brick);
      return $('.gridly').gridly();
    });
    return $('.gridly').gridly();
  });

}).call(this);
/* 代码整理：懒人之家 www.lanrenzhijia.com */